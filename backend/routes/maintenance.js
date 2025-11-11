const express = require('express');
const router = express.Router();
const { query, run, get } = require('../database');
const { authenticate, authorize } = require('../middleware/auth');
const { processInventoryDeduction } = require('../utils/inventoryHelper');

// Listar todas as ordens de manutenção
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { status, equipment_id, scheduled_date, type, page = 1, limit = 20, include_demo } = req.query;

    // Verificar se há dados reais (sem demo)
    const realEquipmentCount = await get('SELECT COUNT(*) as count FROM equipment WHERE (is_demo = 0 OR is_demo IS NULL)');
    const hasRealData = realEquipmentCount?.count > 0;
    const shouldIncludeDemo = include_demo === 'true' || (!hasRealData && include_demo !== 'false');
    
    // Verificar se a coluna is_demo existe antes de usar
    let demoFilter = '';
    try {
      const columnCheck = await query(`PRAGMA table_info(maintenance_orders)`);
      const hasIsDemoColumn = Array.isArray(columnCheck) 
        ? columnCheck.some((col) => col.name === 'is_demo')
        : false;
      
      if (hasIsDemoColumn && !shouldIncludeDemo) {
        demoFilter = 'AND (mo.is_demo = 0 OR mo.is_demo IS NULL)';
      }
    } catch (err) {
      // Se não conseguir verificar, não aplicar filtro
      console.warn('Não foi possível verificar coluna is_demo:', err);
    }

    let sql = `
      SELECT 
        mo.*,
        e.name as equipment_name,
        e.code as equipment_code,
        u.username as assigned_to_name,
        pp.name as plan_name
      FROM maintenance_orders mo
      LEFT JOIN equipment e ON mo.equipment_id = e.id
      LEFT JOIN users u ON mo.assigned_to = u.id
      LEFT JOIN preventive_plans pp ON mo.plan_id = pp.id
      WHERE 1=1
      ${demoFilter}
    `;
    const params = [];

    // Filtrar por tipo se fornecido (padrão: apenas preventivas para compatibilidade)
    if (type) {
      sql += ' AND mo.type = ?';
      params.push(type);
    } else {
      // Por padrão, mostrar apenas preventivas (comportamento atual)
      sql += ' AND mo.type = ?';
      params.push('preventive');
    }

    if (status) {
      sql += ' AND mo.status = ?';
      params.push(status);
    }

    if (equipment_id) {
      sql += ' AND mo.equipment_id = ?';
      params.push(equipment_id);
    }

    if (scheduled_date) {
      sql += ' AND DATE(mo.scheduled_date) = ?';
      params.push(scheduled_date);
    }

    sql += ' ORDER BY mo.scheduled_date ASC LIMIT ? OFFSET ?';
    const offset = (parseInt(page) - 1) * parseInt(limit);
    params.push(parseInt(limit), offset);

    const orders = await query(sql, params);

    // Contar total
    let countSql = `SELECT COUNT(*) as count FROM maintenance_orders mo WHERE 1=1 ${demoFilter}`;
    const countParams = [];
    
    if (type) {
      countSql += ' AND mo.type = ?';
      countParams.push(type);
    } else {
      countSql += ' AND mo.type = ?';
      countParams.push('preventive');
    }
    
    if (status) {
      countSql += ' AND mo.status = ?';
      countParams.push(status);
    }
    if (equipment_id) {
      countSql += ' AND mo.equipment_id = ?';
      countParams.push(equipment_id);
    }
    if (scheduled_date) {
      countSql += ' AND DATE(mo.scheduled_date) = ?';
      countParams.push(scheduled_date);
    }

    const countResult = await get(countSql, countParams);

    res.json({
      success: true,
      data: orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult?.count || 0,
        totalPages: Math.ceil((countResult?.count || 0) / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Obter ordem específica
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const order = await get(`
      SELECT 
        mo.*,
        COALESCE(mo.total_paused_time, 0) as total_paused_time,
        e.name as equipment_name,
        e.code as equipment_code,
        u.username as assigned_to_name,
        pp.name as plan_name,
        pp.estimated_duration as estimated_duration,
        pp.tools_required,
        pp.materials_required,
        pp.safety_procedures,
        pp.manual_reference
      FROM maintenance_orders mo
      LEFT JOIN equipment e ON mo.equipment_id = e.id
      LEFT JOIN users u ON mo.assigned_to = u.id
      LEFT JOIN preventive_plans pp ON mo.plan_id = pp.id
      WHERE mo.id = ?
    `, [req.params.id]);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Ordem de manutenção não encontrada',
      });
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
});

// Atualizar ordem de manutenção
router.put('/:id', authenticate, authorize('admin', 'manager', 'technician'), async (req, res, next) => {
  try {
    console.log('🔄 [DEBUG] Atualizando OS #' + req.params.id, req.body);
    
    const { status, assigned_to, completed_date, execution_time, observations, parts_used } = req.body;

    const updates = [];
    const values = [];

    // Se status mudou para 'in_progress', registrar started_at se ainda não tiver
    // Se estava pausada e retomando, incrementar resume_count
    if (status === 'in_progress') {
      const order = await get('SELECT started_at, status, resume_count FROM maintenance_orders WHERE id = ?', [req.params.id]);
      console.log('📋 [DEBUG] Verificando started_at para OS #' + req.params.id, { started_at: order?.started_at, current_status: order?.status });
      
      if (!order?.started_at) {
        // Usar ISO string para garantir timezone correto
        updates.push('started_at = ?');
        values.push(new Date().toISOString());
        console.log('✅ [DEBUG] started_at será registrado');
      } else if (order?.status === 'paused') {
        // Retomando de pausa
        const resumeCount = (order.resume_count || 0) + 1;
        updates.push('resume_count = ?');
        values.push(resumeCount);
        console.log('✅ [DEBUG] Retomando execução (tentativa #' + resumeCount + ')');
      }
    }

    // Se pausando, registrar paused_at e reason
    if (status === 'paused') {
      // Usar ISO string para garantir timezone correto
      updates.push('paused_at = ?');
      values.push(new Date().toISOString());
      const pauseReason = req.body.pause_reason || null;
      if (pauseReason) {
        updates.push('pause_reason = ?');
        values.push(pauseReason);
      }
    }

    // Se cancelando, registrar cancelled_at, cancelled_by e reason
    if (status === 'cancelled') {
      // Usar ISO string para garantir timezone correto
      updates.push('cancelled_at = ?');
      values.push(new Date().toISOString());
      updates.push('cancelled_by = ?');
      values.push(req.user.id);
      const cancelReason = req.body.cancel_reason || null;
      if (cancelReason) {
        updates.push('cancel_reason = ?');
        values.push(cancelReason);
      }
    }

    if (status) {
      updates.push('status = ?');
      values.push(status);
      console.log('📝 [DEBUG] Atualizando status para:', status);
    }

    if (assigned_to !== undefined) {
      updates.push('assigned_to = ?');
      values.push(assigned_to);
    }

    if (completed_date !== undefined) {
      updates.push('completed_date = ?');
      values.push(completed_date);
    }

    if (execution_time !== undefined) {
      updates.push('execution_time = ?');
      values.push(execution_time);
    }

    // Se não há nada para atualizar
    if (updates.length === 0) {
      console.error('❌ [DEBUG] Nenhum campo para atualizar');
      return res.status(400).json({
        success: false,
        error: 'Nenhum campo para atualizar',
      });
    }

    // Observations
    if (observations !== undefined) {
      updates.push('observations = ?');
      values.push(observations || null);
    }

    // Parts used
    if (parts_used !== undefined) {
      updates.push('parts_used = ?');
      values.push(parts_used || null);
    }

    // Usar ISO string para garantir timezone correto
    updates.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(req.params.id);

    console.log('🔧 [DEBUG] Executando UPDATE:', {
      sql: `UPDATE maintenance_orders SET ${updates.join(', ')} WHERE id = ?`,
      values: values,
    });

    const result = await run(`
      UPDATE maintenance_orders 
      SET ${updates.join(', ')}
      WHERE id = ?
    `, values);

    console.log('✅ [DEBUG] OS atualizada:', result.changes, 'linha(s) afetada(s)');

    // Se foi concluída, processar baixa de estoque e atualizar última preventiva do equipamento
    if (status === 'completed') {
      // Processar baixa de estoque se houver parts_used
      if (parts_used) {
        console.log('📦 [DEBUG] Processando baixa de estoque para OS #' + req.params.id);
        const db = { query, get, run };
        const inventoryResult = await processInventoryDeduction(
          db,
          'maintenance_order',
          parseInt(req.params.id),
          parts_used,
          req.user.id
        );

        if (!inventoryResult.success) {
          console.error('❌ [DEBUG] Erros na baixa de estoque:', inventoryResult.errors);
          return res.status(400).json({
            success: false,
            error: 'Erro ao processar baixa de estoque',
            details: inventoryResult.errors,
          });
        }
        console.log('✅ [DEBUG] Baixa de estoque processada:', inventoryResult.processed, 'item(ns)');
      }

      const order = await get('SELECT equipment_id FROM maintenance_orders WHERE id = ?', [req.params.id]);
      if (order) {
        await run(
          `UPDATE equipment 
           SET last_preventive_date = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [order.equipment_id]
        );
      }
    }

    const updatedOrder = await get(`
      SELECT 
        mo.*,
        e.name as equipment_name,
        e.code as equipment_code,
        u.username as assigned_to_name
      FROM maintenance_orders mo
      LEFT JOIN equipment e ON mo.equipment_id = e.id
      LEFT JOIN users u ON mo.assigned_to = u.id
      WHERE mo.id = ?
    `, [req.params.id]);

    res.json({
      success: true,
      message: 'Ordem de manutenção atualizada com sucesso',
      data: updatedOrder,
    });
  } catch (error) {
    next(error);
  }
});

// Concluir ordem preventiva
router.post('/:id/complete', authenticate, authorize('admin', 'manager', 'technician'), async (req, res, next) => {
  try {
    console.log('🔄 [DEBUG] Concluindo OS #' + req.params.id);
    
    const { observations, parts_used } = req.body;
    
    const order = await get('SELECT * FROM maintenance_orders WHERE id = ?', [req.params.id]);

    if (!order) {
      console.error('❌ [DEBUG] OS não encontrada:', req.params.id);
      return res.status(404).json({
        success: false,
        error: 'Ordem de manutenção não encontrada',
      });
    }

    console.log('📋 [DEBUG] OS encontrada:', {
      id: order.id,
      plan_id: order.plan_id,
      equipment_id: order.equipment_id,
      status: order.status,
    });

    // Calcular tempo de execução se tiver started_at (considerando pausas)
    let executionTime = null;
    if (order.started_at) {
      const startTime = new Date(order.started_at);
      const endTime = new Date();
      const totalTime = Math.round((endTime - startTime) / 1000 / 60); // minutos
      const totalPausedTime = order.total_paused_time || 0;
      
      // Se estiver pausada no momento, adicionar tempo da pausa atual
      let currentPauseTime = 0;
      if (order.status === 'paused' && order.paused_at) {
        const pausedAt = new Date(order.paused_at);
        currentPauseTime = Math.round((endTime - pausedAt) / 1000 / 60);
      }
      
      executionTime = Math.max(0, totalTime - totalPausedTime - currentPauseTime);
      console.log('⏱️ [DEBUG] Tempo de execução calculado:', {
        totalTime,
        totalPausedTime,
        currentPauseTime,
        executionTime
      }, 'minutos');
    }

    // Processar baixa de estoque se houver parts_used
    let inventoryResult = null;
    if (parts_used) {
      console.log('📦 [DEBUG] Processando baixa de estoque para OS #' + req.params.id);
      const db = { query, get, run };
      inventoryResult = await processInventoryDeduction(
        db,
        'maintenance_order',
        parseInt(req.params.id),
        parts_used,
        req.user.id
      );

      if (!inventoryResult.success) {
        console.error('❌ [DEBUG] Erros na baixa de estoque:', inventoryResult.errors);
        return res.status(400).json({
          success: false,
          error: 'Erro ao processar baixa de estoque',
          details: inventoryResult.errors,
        });
      }
      console.log('✅ [DEBUG] Baixa de estoque processada:', inventoryResult.processed, 'item(ns)');
    }

    // Usar ISO string para garantir timezone correto
    const completedAt = new Date().toISOString();
    const partsUsedJson = typeof parts_used === 'string' ? parts_used : (parts_used ? JSON.stringify(parts_used) : null);
    await run(
      `UPDATE maintenance_orders 
       SET status = 'completed', completed_date = ?, updated_at = ?, execution_time = ?, observations = ?, parts_used = ?
       WHERE id = ?`,
      [completedAt, completedAt, executionTime, observations || null, partsUsedJson, req.params.id]
    );

    console.log('✅ [DEBUG] OS atualizada para concluída');

    // Atualizar última preventiva do equipamento
    await run(
      `UPDATE equipment 
       SET last_preventive_date = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [order.equipment_id]
    );

    console.log('✅ [DEBUG] Equipamento atualizado');

    // Se for uma OS preventiva com plano, gerar próxima OS automaticamente
    if (order.plan_id && order.type === 'preventive') {
      console.log('🔄 [DEBUG] Gerando próxima OS para o plano #' + order.plan_id);
      
      try {
        const plan = await get('SELECT * FROM preventive_plans WHERE id = ?', [order.plan_id]);
        
        if (plan && plan.is_active === 1) {
          console.log('📋 [DEBUG] Plano encontrado e ativo:', {
            id: plan.id,
            name: plan.name,
            frequency_type: plan.frequency_type,
            frequency_value: plan.frequency_value,
          });

          // Calcular próxima data baseada na data de conclusão (hoje)
          // Usar a data atual, pois estamos concluindo agora
          const baseDate = new Date().toISOString().split('T')[0];
          const nextDate = calculateNextDate(baseDate, plan.frequency_type, plan.frequency_value);
          
          console.log('📅 [DEBUG] Próxima data calculada:', nextDate);

          // Verificar se já existe OS para esta data
          const existing = await get(
            'SELECT id FROM maintenance_orders WHERE plan_id = ? AND scheduled_date = ?',
            [order.plan_id, nextDate]
          );

          if (!existing) {
            const result = await run(
              `INSERT INTO maintenance_orders 
              (plan_id, equipment_id, type, description, instructions, scheduled_date, assigned_to, created_by)
              VALUES (?, ?, 'preventive', ?, ?, ?, ?, ?)`,
              [
                plan.id,
                plan.equipment_id,
                `Preventiva: ${plan.name}`,
                plan.instructions || null,
                nextDate,
                plan.assigned_to || null,
                plan.created_by,
              ]
            );

            console.log('✅ [DEBUG] Próxima OS gerada automaticamente:', {
              os_id: result.lastID,
              scheduled_date: nextDate,
            });

            // Atualizar próxima preventiva do equipamento
            await run(
              `UPDATE equipment 
               SET next_preventive_date = ?, updated_at = CURRENT_TIMESTAMP
               WHERE id = ?`,
              [nextDate, plan.equipment_id]
            );

            console.log('✅ [DEBUG] Próxima preventiva do equipamento atualizada');
          } else {
            console.log('ℹ️ [DEBUG] OS já existe para a data:', nextDate);
          }
        } else {
          console.log('⚠️ [DEBUG] Plano não encontrado ou inativo');
        }
      } catch (genError) {
        console.error('❌ [DEBUG] Erro ao gerar próxima OS (não crítico):', genError);
        // Não falhar a conclusão se a geração da próxima OS falhar
      }
    }

    res.json({
      success: true,
      message: 'Ordem de manutenção concluída com sucesso',
    });
  } catch (error) {
    console.error('❌ [DEBUG] Erro ao concluir OS:', error);
    next(error);
  }
});

// Pausar ordem de manutenção
router.post('/:id/pause', authenticate, authorize('admin', 'manager', 'technician'), async (req, res, next) => {
  try {
    const { pause_reason } = req.body;
    const order = await get('SELECT status FROM maintenance_orders WHERE id = ?', [req.params.id]);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Ordem de manutenção não encontrada',
      });
    }

    if (order.status !== 'in_progress') {
      return res.status(400).json({
        success: false,
        error: 'Apenas OS em execução podem ser pausadas',
      });
    }

    // Usar ISO string para garantir timezone correto
    const pausedAt = new Date().toISOString();
    await run(
      `UPDATE maintenance_orders 
       SET status = 'paused', paused_at = ?, pause_reason = ?, updated_at = ?
       WHERE id = ?`,
      [pausedAt, pause_reason || null, pausedAt, req.params.id]
    );

    res.json({
      success: true,
      message: 'Ordem de manutenção pausada com sucesso',
    });
  } catch (error) {
    next(error);
  }
});

// Retomar ordem de manutenção pausada
router.post('/:id/resume', authenticate, authorize('admin', 'manager', 'technician'), async (req, res, next) => {
  try {
    const order = await get('SELECT status, resume_count, paused_at, total_paused_time FROM maintenance_orders WHERE id = ?', [req.params.id]);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Ordem de manutenção não encontrada',
      });
    }

    if (order.status !== 'paused') {
      return res.status(400).json({
        success: false,
        error: 'Apenas OS pausadas podem ser retomadas',
      });
    }

    const resumeCount = (order.resume_count || 0) + 1;
    
    // Calcular tempo de pausa e acumular no total_paused_time
    let totalPausedTime = order.total_paused_time || 0;
    if (order.paused_at) {
      const pausedAt = new Date(order.paused_at);
      const now = new Date();
      const pauseDuration = Math.round((now - pausedAt) / 1000 / 60); // minutos
      totalPausedTime += Math.max(0, pauseDuration);
    }

    // Usar ISO string para garantir timezone correto
    const updatedAt = new Date().toISOString();
    await run(
      `UPDATE maintenance_orders 
       SET status = 'in_progress', resume_count = ?, total_paused_time = ?, paused_at = NULL, updated_at = ?
       WHERE id = ?`,
      [resumeCount, totalPausedTime, updatedAt, req.params.id]
    );

    res.json({
      success: true,
      message: 'Ordem de manutenção retomada com sucesso',
    });
  } catch (error) {
    next(error);
  }
});

// Cancelar ordem de manutenção
router.post('/:id/cancel', authenticate, authorize('admin', 'manager', 'technician'), async (req, res, next) => {
  try {
    const { cancel_reason } = req.body;
    const order = await get('SELECT status FROM maintenance_orders WHERE id = ?', [req.params.id]);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Ordem de manutenção não encontrada',
      });
    }

    if (order.status === 'completed') {
      return res.status(400).json({
        success: false,
        error: 'OS já concluída não pode ser cancelada',
      });
    }

    if (order.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        error: 'OS já está cancelada',
      });
    }

    // Usar ISO string para garantir timezone correto
    const cancelledAt = new Date().toISOString();
    await run(
      `UPDATE maintenance_orders 
       SET status = 'cancelled', cancelled_at = ?, cancelled_by = ?, cancel_reason = ?, updated_at = ?
       WHERE id = ?`,
      [cancelledAt, req.user.id, cancel_reason || null, cancelledAt, req.params.id]
    );

    res.json({
      success: true,
      message: 'Ordem de manutenção cancelada com sucesso',
    });
  } catch (error) {
    next(error);
  }
});

// Função auxiliar para calcular próxima data (mesma de plans.js)
function calculateNextDate(currentDate, frequencyType, frequencyValue) {
  const date = new Date(currentDate);

  switch (frequencyType) {
    case 'days':
      date.setDate(date.getDate() + frequencyValue);
      break;
    case 'weeks':
      date.setDate(date.getDate() + (frequencyValue * 7));
      break;
    case 'months':
      date.setMonth(date.getMonth() + frequencyValue);
      break;
    case 'hours':
      // Para horas, assumimos frequência diária
      date.setDate(date.getDate() + Math.ceil(frequencyValue / 24));
      break;
    case 'cycles':
      // Para ciclos, assumimos frequência mensal
      date.setMonth(date.getMonth() + frequencyValue);
      break;
  }

  return date.toISOString().split('T')[0];
}

// Obter calendário de manutenções (rota específica deve vir antes de rotas com parâmetros)
router.get('/calendar/events', authenticate, async (req, res, next) => {
  try {
    const { start_date, end_date, include_demo } = req.query;

    // Verificar se há dados reais (sem demo)
    const realEquipmentCount = await get('SELECT COUNT(*) as count FROM equipment WHERE (is_demo = 0 OR is_demo IS NULL)');
    const hasRealData = realEquipmentCount?.count > 0;
    const shouldIncludeDemo = include_demo === 'true' || (!hasRealData && include_demo !== 'false');
    
    // Verificar se a coluna is_demo existe antes de usar
    let demoFilter = '';
    try {
      const columnCheck = await query(`PRAGMA table_info(maintenance_orders)`);
      const hasIsDemoColumn = Array.isArray(columnCheck) 
        ? columnCheck.some((col) => col.name === 'is_demo')
        : false;
      
      if (hasIsDemoColumn && !shouldIncludeDemo) {
        demoFilter = 'AND (mo.is_demo = 0 OR mo.is_demo IS NULL)';
      }
    } catch (err) {
      // Se não conseguir verificar, não aplicar filtro
      console.warn('Não foi possível verificar coluna is_demo:', err);
    }

    let sql = `
      SELECT 
        mo.id,
        mo.scheduled_date,
        mo.status,
        mo.priority,
        mo.description,
        e.name as equipment_name,
        e.code as equipment_code,
        pp.name as plan_name,
        u.username as assigned_to_name,
        u.full_name as assigned_to_full_name
      FROM maintenance_orders mo
      LEFT JOIN equipment e ON mo.equipment_id = e.id
      LEFT JOIN preventive_plans pp ON mo.plan_id = pp.id
      LEFT JOIN users u ON mo.assigned_to = u.id
      WHERE mo.type = 'preventive'
      ${demoFilter}
    `;

    const params = [];

    if (start_date && end_date) {
      sql += ' AND DATE(mo.scheduled_date) BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }

    sql += ' ORDER BY mo.scheduled_date ASC';

    const events = await query(sql, params);

    res.json({
      success: true,
      data: events,
    });
  } catch (error) {
    next(error);
  }
});

// Deletar ordem de manutenção (colocar no final para evitar conflitos)
router.delete('/:id', authenticate, authorize('admin', 'manager'), async (req, res, next) => {
  try {
    console.log('🗑️ [DEBUG] Tentando deletar OS #' + req.params.id);
    
    // Buscar OS com informações relacionadas
    // Verificar se a coluna is_demo existe antes de selecioná-la
    let isDemoColumns = '';
    try {
      const columnCheck = await query(`PRAGMA table_info(maintenance_orders)`);
      const hasIsDemoColumn = Array.isArray(columnCheck) 
        ? columnCheck.some((col) => col.name === 'is_demo')
        : false;
      
      if (hasIsDemoColumn) {
        isDemoColumns = 'mo.is_demo, e.is_demo as equipment_is_demo, pp.is_demo as plan_is_demo,';
      }
    } catch (err) {
      console.warn('Não foi possível verificar coluna is_demo:', err);
    }
    
    const order = await get(`
      SELECT 
        mo.id, 
        mo.status, 
        ${isDemoColumns}
        mo.plan_id,
        mo.equipment_id
      FROM maintenance_orders mo
      LEFT JOIN equipment e ON mo.equipment_id = e.id
      LEFT JOIN preventive_plans pp ON mo.plan_id = pp.id
      WHERE mo.id = ?
    `, [req.params.id]);

    if (!order) {
      console.log('❌ [DEBUG] OS não encontrada:', req.params.id);
      return res.status(404).json({
        success: false,
        error: 'Ordem de manutenção não encontrada',
      });
    }

    console.log('✅ [DEBUG] OS encontrada:', { 
      id: order.id, 
      status: order.status, 
      is_demo: order.is_demo || null,
      plan_id: order.plan_id,
      equipment_id: order.equipment_id,
      equipment_is_demo: order.equipment_is_demo || null,
      plan_is_demo: order.plan_is_demo || null
    });

    // Deletar histórico relacionado primeiro
    const historyResult = await run('DELETE FROM maintenance_history WHERE order_id = ?', [req.params.id]);
    console.log('🗑️ [DEBUG] Histórico deletado:', historyResult.changes, 'registros');

    // Deletar a ordem
    const deleteResult = await run('DELETE FROM maintenance_orders WHERE id = ?', [req.params.id]);
    console.log('✅ [DEBUG] OS deletada:', deleteResult.changes, 'registros');

    if (deleteResult.changes === 0) {
      console.log('⚠️ [DEBUG] Nenhuma OS foi deletada (pode já ter sido deletada)');
      return res.status(404).json({
        success: false,
        error: 'Ordem de manutenção não encontrada ou já foi deletada',
      });
    }

    res.json({
      success: true,
      message: 'Ordem de manutenção deletada com sucesso',
    });
  } catch (error) {
    console.error('❌ [DEBUG] Erro ao deletar OS:', error);
    next(error);
  }
});

module.exports = router;

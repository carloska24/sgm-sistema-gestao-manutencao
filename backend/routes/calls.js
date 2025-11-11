const express = require('express');
const router = express.Router();
const { z } = require('zod');
const { query, run, get } = require('../database');
const { authenticate, authorize } = require('../middleware/auth');
const { processInventoryDeduction } = require('../utils/inventoryHelper');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Schema de validação
const createCallSchema = z.object({
  equipment_id: z.number().int().positive('Equipamento é obrigatório'),
  type: z.enum(['preventive', 'corrective', 'predictive', 'emergency']).default('corrective'),
  problem_type: z.string().optional(),
  description: z.string().min(1, 'Descrição é obrigatória'),
  occurrence_date: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
});

const updateCallSchema = z.object({
  status: z.enum(['open', 'analysis', 'assigned', 'execution', 'waiting_parts', 'completed', 'cancelled']).optional(),
  type: z.enum(['preventive', 'corrective', 'predictive', 'emergency']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  assigned_to: z.number().int().positive().optional().nullable(),
  problem_type: z.string().optional(),
  description: z.string().optional(),
  execution_notes: z.string().optional(),
  parts_used: z.string().optional(),
});

// Configuração de upload de arquivos para chamados
const uploadDir = path.join(__dirname, '../uploads/calls');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Tipo de arquivo não permitido'));
  },
});

// Listar chamados com filtros e paginação
router.get('/', authenticate, async (req, res, next) => {
  try {
    const {
      search,
      status,
      priority,
      type,
      equipment_id,
      assigned_to,
      created_by,
      page = 1,
      limit = 20,
    } = req.query;

    const { include_demo } = req.query;
    const realEquipmentCount = await get('SELECT COUNT(*) as count FROM equipment WHERE (is_demo = 0 OR is_demo IS NULL)');
    const hasRealData = realEquipmentCount?.count > 0;
    const shouldIncludeDemo = include_demo === 'true' || (!hasRealData && include_demo !== 'false');
    
    // Se for técnico, mostrar apenas chamados atribuídos a ele ou criados por ele
    const userRole = req.user.role;
    const isTechnician = userRole === 'technician';
    const isRequester = userRole === 'requester';
    
    let sql = `
      SELECT 
        mc.*,
        e.name as equipment_name,
        e.code as equipment_code,
        u1.username as assigned_to_name,
        u1.full_name as assigned_to_full_name,
        u2.username as created_by_name,
        u2.full_name as created_by_full_name
      FROM maintenance_calls mc
      LEFT JOIN equipment e ON mc.equipment_id = e.id
      LEFT JOIN users u1 ON mc.assigned_to = u1.id
      LEFT JOIN users u2 ON mc.created_by = u2.id
    `;
    const params = [];
    
    // Adicionar filtro demo
    const whereConditions = [];
    if (!shouldIncludeDemo) {
      whereConditions.push('(mc.is_demo = 0 OR mc.is_demo IS NULL)');
    }
    
    // Filtro automático por role: técnicos veem apenas seus chamados atribuídos ou criados por eles
    if (isTechnician) {
      // Técnico vê chamados atribuídos a ele OU criados por ele
      whereConditions.push('(mc.assigned_to = ? OR mc.created_by = ?)');
      params.push(req.user.id, req.user.id);
      console.log(`👤 [DEBUG] Filtro de técnico aplicado: user_id=${req.user.id}, username=${req.user.username}`);
    } else if (isRequester) {
      // Requester vê apenas chamados criados por ele
      whereConditions.push('mc.created_by = ?');
      params.push(req.user.id);
      console.log(`👤 [DEBUG] Filtro de requester aplicado: user_id=${req.user.id}`);
    } else {
      console.log(`👤 [DEBUG] Usuário ${req.user.role} (id=${req.user.id}) - sem filtro automático de role`);
    }

    if (search) {
      whereConditions.push('(mc.description LIKE ? OR e.name LIKE ? OR e.code LIKE ?)');
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

      if (status) {
        whereConditions.push('mc.status = ?');
        params.push(status);
      }

      if (priority) {
        whereConditions.push('mc.priority = ?');
        params.push(priority);
      }

      if (type) {
        whereConditions.push('mc.type = ?');
        params.push(type);
      }

      if (equipment_id) {
        whereConditions.push('mc.equipment_id = ?');
        params.push(equipment_id);
      }

      // Filtro assigned_to: apenas se não for técnico (técnicos já estão filtrados acima)
      // ou se for admin/manager filtrando por outro técnico
      if (assigned_to && !isTechnician && !isRequester) {
        whereConditions.push('mc.assigned_to = ?');
        params.push(assigned_to);
      }

      // Filtro created_by: apenas se não for requester (requesters já estão filtrados acima)
      if (created_by && !isRequester) {
        whereConditions.push('mc.created_by = ?');
        params.push(created_by);
      }
      
      // Adicionar WHERE se houver condições
      if (whereConditions.length > 0) {
        sql += ' WHERE ' + whereConditions.join(' AND ');
      }

    sql += ' ORDER BY mc.created_at DESC LIMIT ? OFFSET ?';
    const offset = (parseInt(page) - 1) * parseInt(limit);
    params.push(parseInt(limit), offset);

    console.log('🔍 [DEBUG] Query SQL:', sql);
    console.log('🔍 [DEBUG] Parâmetros:', params);
    
    const calls = await query(sql, params);
    
    console.log('📊 [DEBUG] Chamados encontrados:', calls.length);
    calls.forEach(call => {
      console.log(`  - Chamado #${call.id}: status=${call.status}, assigned_to=${call.assigned_to}, assigned_to_name=${call.assigned_to_name}, created_by=${call.created_by}, equipment=${call.equipment_name}`);
    });

    // Contar total
    let countSql = `
      SELECT COUNT(*) as count
      FROM maintenance_calls mc
      LEFT JOIN equipment e ON mc.equipment_id = e.id
    `;
    const countParams = [];
    const countWhereConditions = [];
    
    if (!shouldIncludeDemo) {
      countWhereConditions.push('(mc.is_demo = 0 OR mc.is_demo IS NULL)');
    }

    if (search) {
      countWhereConditions.push('(mc.description LIKE ? OR e.name LIKE ? OR e.code LIKE ?)');
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
    }
    
    if (status) {
      countWhereConditions.push('mc.status = ?');
      countParams.push(status);
    }
    
    if (priority) {
      countWhereConditions.push('mc.priority = ?');
      countParams.push(priority);
    }
    
    if (type) {
      countWhereConditions.push('mc.type = ?');
      countParams.push(type);
    }
    
    if (equipment_id) {
      countWhereConditions.push('mc.equipment_id = ?');
      countParams.push(equipment_id);
    }
    
    // Aplicar mesmo filtro de role na contagem
    if (isTechnician) {
      countWhereConditions.push('(mc.assigned_to = ? OR mc.created_by = ?)');
      countParams.push(req.user.id, req.user.id);
    } else if (isRequester) {
      countWhereConditions.push('mc.created_by = ?');
      countParams.push(req.user.id);
    }
    
    if (assigned_to && !isTechnician && !isRequester) {
      countWhereConditions.push('mc.assigned_to = ?');
      countParams.push(assigned_to);
    }
    
    if (created_by && !isRequester) {
      countWhereConditions.push('mc.created_by = ?');
      countParams.push(created_by);
    }
    
    // Adicionar WHERE se houver condições
    if (countWhereConditions.length > 0) {
      countSql += ' WHERE ' + countWhereConditions.join(' AND ');
    }

    console.log('🔢 [DEBUG] Query de contagem:', countSql);
    console.log('🔢 [DEBUG] Parâmetros de contagem:', countParams);
    
    const countResult = await get(countSql, countParams);
    
    console.log('📈 [DEBUG] Total de chamados:', countResult?.count || 0);
    console.log('📈 [DEBUG] Página atual:', page);
    console.log('📈 [DEBUG] Total de páginas:', Math.ceil((countResult?.count || 0) / parseInt(limit)));

    res.json({
      success: true,
      data: calls,
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

// Obter chamado específico com histórico
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const call = await get(
      `SELECT 
        mc.*,
        COALESCE(mc.total_paused_time, 0) as total_paused_time,
        e.name as equipment_name,
        e.code as equipment_code,
        u1.username as assigned_to_name,
        u2.username as created_by_name,
        u2.full_name as created_by_full_name
       FROM maintenance_calls mc
       LEFT JOIN equipment e ON mc.equipment_id = e.id
       LEFT JOIN users u1 ON mc.assigned_to = u1.id
       LEFT JOIN users u2 ON mc.created_by = u2.id
       WHERE mc.id = ?`,
      [req.params.id]
    );

    if (!call) {
      return res.status(404).json({
        success: false,
        error: 'Chamado não encontrado',
      });
    }

    // Buscar atividades
    const activities = await query(
      `SELECT ca.*, u.username as performed_by_name
       FROM call_activities ca
       LEFT JOIN users u ON ca.performed_by = u.id
       WHERE ca.call_id = ?
       ORDER BY ca.created_at DESC`,
      [req.params.id]
    );

    // Buscar histórico
    const history = await query(
      `SELECT ch.*, u.username as performed_by_name
       FROM call_history ch
       LEFT JOIN users u ON ch.performed_by = u.id
       WHERE ch.call_id = ?
       ORDER BY ch.created_at DESC`,
      [req.params.id]
    );

    // Buscar documentos/fotos
    const documents = await query(
      `SELECT d.*, u.username as uploaded_by_name
       FROM call_documents d
       LEFT JOIN users u ON d.uploaded_by = u.id
       WHERE d.call_id = ?
       ORDER BY d.phase, d.created_at DESC`,
      [req.params.id]
    );

    res.json({
      success: true,
      data: {
        ...call,
        activities,
        history,
        documents,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Criar novo chamado
router.post('/', authenticate, async (req, res, next) => {
  try {
    const data = createCallSchema.parse(req.body);

    const result = await run(
      `INSERT INTO maintenance_calls 
      (equipment_id, type, problem_type, description, occurrence_date, priority, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        data.equipment_id,
        data.type || 'corrective',
        data.problem_type || null,
        data.description,
        data.occurrence_date || new Date().toISOString(),
        data.priority,
        req.user.id,
      ]
    );

    // Criar log de histórico
    await run(
      `INSERT INTO call_history (call_id, action, performed_by, notes)
       VALUES (?, 'created', ?, ?)`,
      [result.lastID, req.user.id, 'Chamado criado']
    );

    const newCall = await get(
      `SELECT 
        mc.*,
        e.name as equipment_name,
        e.code as equipment_code,
        u.username as created_by_name
       FROM maintenance_calls mc
       LEFT JOIN equipment e ON mc.equipment_id = e.id
       LEFT JOIN users u ON mc.created_by = u.id
       WHERE mc.id = ?`,
      [result.lastID]
    );

    res.status(201).json({
      success: true,
      message: 'Chamado criado com sucesso',
      data: newCall,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        details: error.errors,
      });
    }
    next(error);
  }
});

// Atualizar chamado
router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const call = await get('SELECT * FROM maintenance_calls WHERE id = ?', [req.params.id]);

    if (!call) {
      return res.status(404).json({
        success: false,
        error: 'Chamado não encontrado',
      });
    }

    // Verificar permissões
    const isOwner = call.created_by === req.user.id;
    const isAssigned = call.assigned_to === req.user.id;
    const isManager = req.user.role === 'admin' || req.user.role === 'manager';

    if (!isOwner && !isAssigned && !isManager) {
      return res.status(403).json({
        success: false,
        error: 'Sem permissão para editar este chamado',
      });
    }

    const data = updateCallSchema.parse(req.body);
    const updates = [];
    const values = [];
    const historyEntries = [];

    // Status
    if (data.status && data.status !== call.status) {
      updates.push('status = ?');
      values.push(data.status);
      historyEntries.push({
        action: 'status_changed',
        old_value: call.status,
        new_value: data.status,
      });
    }

    // Priority
    if (data.priority && data.priority !== call.priority) {
      updates.push('priority = ?');
      values.push(data.priority);
      historyEntries.push({
        action: 'priority_changed',
        old_value: call.priority,
        new_value: data.priority,
      });
    }

    // Type
    if (data.type && data.type !== call.type) {
      updates.push('type = ?');
      values.push(data.type);
      historyEntries.push({
        action: 'type_changed',
        old_value: call.type,
        new_value: data.type,
      });
    }

    // Assigned to
    if (data.assigned_to !== undefined && data.assigned_to !== call.assigned_to) {
      updates.push('assigned_to = ?');
      // Usar ISO string para garantir timezone correto
      updates.push('assigned_at = ?');
      const assignedAt = new Date().toISOString();
      values.push(data.assigned_to);
      values.push(assignedAt);
      historyEntries.push({
        action: 'assigned',
        old_value: call.assigned_to?.toString() || null,
        new_value: data.assigned_to?.toString() || null,
      });
    }

    // Description
    if (data.description !== undefined) {
      updates.push('description = ?');
      values.push(data.description);
    }

    // Problem type
    if (data.problem_type !== undefined) {
      updates.push('problem_type = ?');
      values.push(data.problem_type);
    }

    // Execution notes
    if (data.execution_notes !== undefined) {
      updates.push('execution_notes = ?');
      values.push(data.execution_notes);
    }

    // Parts used
    if (data.parts_used !== undefined) {
      updates.push('parts_used = ?');
      values.push(data.parts_used);
    }

    // Usar ISO string para garantir timezone correto
    updates.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(req.params.id);

    if (updates.length > 1) {
      await run(
        `UPDATE maintenance_calls SET ${updates.join(', ')} WHERE id = ?`,
        values
      );

      // Registrar histórico
      for (const entry of historyEntries) {
        await run(
          `INSERT INTO call_history (call_id, action, old_value, new_value, performed_by)
           VALUES (?, ?, ?, ?, ?)`,
          [req.params.id, entry.action, entry.old_value, entry.new_value, req.user.id]
        );
      }
    }

    const updatedCall = await get(
      `SELECT 
        mc.*,
        e.name as equipment_name,
        e.code as equipment_code,
        u1.username as assigned_to_name,
        u2.username as created_by_name
       FROM maintenance_calls mc
       LEFT JOIN equipment e ON mc.equipment_id = e.id
       LEFT JOIN users u1 ON mc.assigned_to = u1.id
       LEFT JOIN users u2 ON mc.created_by = u2.id
       WHERE mc.id = ?`,
      [req.params.id]
    );

    res.json({
      success: true,
      message: 'Chamado atualizado com sucesso',
      data: updatedCall,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        details: error.errors,
      });
    }
    next(error);
  }
});

// Deletar chamado (apenas admin/manager ou criador)
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const call = await get('SELECT created_by FROM maintenance_calls WHERE id = ?', [req.params.id]);

    if (!call) {
      return res.status(404).json({
        success: false,
        error: 'Chamado não encontrado',
      });
    }

    const isOwner = call.created_by === req.user.id;
    const isManager = req.user.role === 'admin' || req.user.role === 'manager';

    if (!isOwner && !isManager) {
      return res.status(403).json({
        success: false,
        error: 'Sem permissão para deletar este chamado',
      });
    }

    const result = await run('DELETE FROM maintenance_calls WHERE id = ?', [req.params.id]);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'Chamado não encontrado',
      });
    }

    res.json({
      success: true,
      message: 'Chamado deletado com sucesso',
    });
  } catch (error) {
    next(error);
  }
});

// Adicionar atividade ao chamado
router.post('/:id/activities', authenticate, async (req, res, next) => {
  try {
    const { activity } = req.body;

    if (!activity || activity.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Atividade é obrigatória',
      });
    }

    const call = await get('SELECT id FROM maintenance_calls WHERE id = ?', [req.params.id]);

    if (!call) {
      return res.status(404).json({
        success: false,
        error: 'Chamado não encontrado',
      });
    }

    const result = await run(
      `INSERT INTO call_activities (call_id, activity, performed_by)
       VALUES (?, ?, ?)`,
      [req.params.id, activity, req.user.id]
    );

    res.status(201).json({
      success: true,
      message: 'Atividade registrada com sucesso',
      data: {
        id: result.lastID,
        activity,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Iniciar execução do chamado
router.post('/:id/start', authenticate, authorize('admin', 'manager', 'technician'), async (req, res, next) => {
  try {
    const call = await get('SELECT * FROM maintenance_calls WHERE id = ?', [req.params.id]);

    if (!call) {
      return res.status(404).json({
        success: false,
        error: 'Chamado não encontrado',
      });
    }

    // Usar ISO string para garantir timezone correto
    const startedAt = new Date().toISOString();
    await run(
      `UPDATE maintenance_calls 
       SET status = 'execution', started_at = ?, updated_at = ?
       WHERE id = ?`,
      [startedAt, startedAt, req.params.id]
    );

    await run(
      `INSERT INTO call_history (call_id, action, performed_by, notes)
       VALUES (?, 'started', ?, 'Execução iniciada')`,
      [req.params.id, req.user.id]
    );

    res.json({
      success: true,
      message: 'Execução iniciada',
    });
  } catch (error) {
    next(error);
  }
});

// Concluir chamado
router.post('/:id/complete', authenticate, authorize('admin', 'manager', 'technician'), async (req, res, next) => {
  try {
    const callId = req.params.id;
    console.log('🔄 [DEBUG] Concluindo chamado #' + callId);
    
    const { parts_used } = req.body;
    
    const call = await get('SELECT started_at, status, equipment_id, parts_used FROM maintenance_calls WHERE id = ?', [callId]);

    if (!call) {
      console.error('❌ [DEBUG] Chamado não encontrado:', callId);
      return res.status(404).json({
        success: false,
        error: 'Chamado não encontrado',
      });
    }

    console.log('📋 [DEBUG] Estado atual do chamado:', {
      id: callId,
      status: call.status,
      started_at: call.started_at,
      equipment_id: call.equipment_id,
    });

    // Calcular tempo de execução considerando pausas
    const callDetails = await get(
      'SELECT started_at, total_paused_time, paused_at FROM maintenance_calls WHERE id = ?', 
      [callId]
    );
    
    let executionTime = null;
    if (callDetails && callDetails.started_at) {
      const startTime = new Date(callDetails.started_at);
      const endTime = new Date();
      const totalTime = Math.round((endTime - startTime) / 1000 / 60); // minutos
      
      // Calcular tempo de pausa atual se estiver pausado
      let currentPauseTime = 0;
      if (call.status === 'paused' && callDetails.paused_at) {
        const pausedAt = new Date(callDetails.paused_at);
        currentPauseTime = Math.round((endTime - pausedAt) / 1000 / 60);
      }
      
      // Tempo total de pausas acumuladas + pausa atual
      const totalPausedTime = (callDetails.total_paused_time || 0) + currentPauseTime;
      
      // Tempo de execução = tempo total - tempo de pausas
      executionTime = Math.max(0, totalTime - totalPausedTime);
      console.log('⏱️ [DEBUG] Tempo de execução calculado (com pausas):', {
        totalTime,
        totalPausedTime,
        executionTime,
        currentPauseTime
      });
    }

    // Processar baixa de estoque se houver parts_used
    // Usar parts_used do body se fornecido, senão usar do chamado existente
    const partsUsedToProcess = parts_used || call.parts_used;
    let inventoryResult = null;
    if (partsUsedToProcess) {
      console.log('📦 [DEBUG] Processando baixa de estoque para chamado #' + callId);
      const db = { query, get, run };
      inventoryResult = await processInventoryDeduction(
        db,
        'maintenance_call',
        parseInt(callId),
        partsUsedToProcess,
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
    const partsUsedJson = typeof partsUsedToProcess === 'string' ? partsUsedToProcess : (partsUsedToProcess ? JSON.stringify(partsUsedToProcess) : null);
    const updateResult = await run(
      `UPDATE maintenance_calls 
       SET status = 'completed', completed_at = ?, execution_time = ?, updated_at = ?, paused_at = NULL, parts_used = ?
       WHERE id = ?`,
      [completedAt, executionTime, completedAt, partsUsedJson, callId]
    );

    console.log('✅ [DEBUG] Chamado atualizado:', updateResult.changes, 'linha(s) afetada(s)');

    // Verificar se a atualização funcionou
    const updatedCall = await get('SELECT status, completed_at FROM maintenance_calls WHERE id = ?', [callId]);
    console.log('✅ [DEBUG] Estado após atualização:', {
      status: updatedCall?.status,
      completed_at: updatedCall?.completed_at,
    });

    // Atualizar última manutenção corretiva do equipamento
    if (call.equipment_id) {
      // Usar ISO string para garantir timezone correto
      const updatedAt = new Date().toISOString();
      await run(
        `UPDATE equipment 
         SET last_corrective_date = ?, updated_at = ?
         WHERE id = ?`,
        [updatedAt, updatedAt, call.equipment_id]
      );
      console.log('✅ [DEBUG] Equipamento atualizado:', call.equipment_id);
    }

    await run(
      `INSERT INTO call_history (call_id, action, performed_by, notes)
       VALUES (?, 'completed', ?, 'Chamado concluído')`,
      [callId, req.user.id]
    );
    console.log('✅ [DEBUG] Histórico registrado');

    res.json({
      success: true,
      message: 'Chamado concluído com sucesso',
      data: updatedCall,
    });
  } catch (error) {
    console.error('❌ [DEBUG] Erro ao concluir chamado:', error);
    next(error);
  }
});

// Pausar chamado
router.post('/:id/pause', authenticate, authorize('admin', 'manager', 'technician'), async (req, res, next) => {
  try {
    const { pause_reason } = req.body;
    const call = await get('SELECT status FROM maintenance_calls WHERE id = ?', [req.params.id]);

    if (!call) {
      return res.status(404).json({
        success: false,
        error: 'Chamado não encontrado',
      });
    }

    if (call.status !== 'execution') {
      return res.status(400).json({
        success: false,
        error: 'Apenas chamados em execução podem ser pausados',
      });
    }

    // Usar ISO string para garantir timezone correto
    const pausedAt = new Date().toISOString();
    await run(
      `UPDATE maintenance_calls 
       SET status = 'paused', paused_at = ?, pause_reason = ?, updated_at = ?
       WHERE id = ?`,
      [pausedAt, pause_reason || null, pausedAt, req.params.id]
    );

    await run(
      `INSERT INTO call_history (call_id, action, performed_by, notes)
       VALUES (?, 'paused', ?, ?)`,
      [req.params.id, req.user.id, pause_reason ? `Pausado: ${pause_reason}` : 'Chamado pausado']
    );

    res.json({
      success: true,
      message: 'Chamado pausado com sucesso',
    });
  } catch (error) {
    next(error);
  }
});

// Retomar chamado pausado
router.post('/:id/resume', authenticate, authorize('admin', 'manager', 'technician'), async (req, res, next) => {
  try {
    const call = await get('SELECT status, resume_count, paused_at, total_paused_time FROM maintenance_calls WHERE id = ?', [req.params.id]);

    if (!call) {
      return res.status(404).json({
        success: false,
        error: 'Chamado não encontrado',
      });
    }

    if (call.status !== 'paused') {
      return res.status(400).json({
        success: false,
        error: 'Apenas chamados pausados podem ser retomados',
      });
    }

    const resumeCount = (call.resume_count || 0) + 1;
    
    // Calcular tempo de pausa e acumular no total_paused_time
    let totalPausedTime = call.total_paused_time || 0;
    if (call.paused_at) {
      const pausedAt = new Date(call.paused_at);
      const now = new Date();
      const pauseDuration = Math.round((now - pausedAt) / 1000 / 60); // minutos
      totalPausedTime += Math.max(0, pauseDuration);
    }

    // Usar ISO string para garantir timezone correto
    const updatedAt = new Date().toISOString();
    await run(
      `UPDATE maintenance_calls 
       SET status = 'execution', resume_count = ?, total_paused_time = ?, paused_at = NULL, updated_at = ?
       WHERE id = ?`,
      [resumeCount, totalPausedTime, updatedAt, req.params.id]
    );

    await run(
      `INSERT INTO call_history (call_id, action, performed_by, notes)
       VALUES (?, 'resumed', ?, 'Chamado retomado')`,
      [req.params.id, req.user.id]
    );

    res.json({
      success: true,
      message: 'Chamado retomado com sucesso',
    });
  } catch (error) {
    next(error);
  }
});

// Upload de documentos/fotos do chamado
router.post('/:id/documents', authenticate, authorize('admin', 'manager', 'technician'), upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Arquivo não fornecido',
      });
    }

    const call = await get('SELECT id FROM maintenance_calls WHERE id = ?', [req.params.id]);

    if (!call) {
      // Deletar arquivo se chamado não existe
      fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        error: 'Chamado não encontrado',
      });
    }

    const phase = req.body.phase || 'during'; // 'during' ou 'after'
    const documentType = req.body.document_type || 'photo';

    const result = await run(
      `INSERT INTO call_documents 
      (call_id, file_name, file_path, file_type, file_size, document_type, phase, uploaded_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.params.id,
        req.file.originalname,
        req.file.path,
        req.file.mimetype,
        req.file.size,
        documentType,
        phase,
        req.user.id,
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Documento enviado com sucesso',
      data: {
        id: result.lastID,
        file_name: req.file.originalname,
        phase,
      },
    });
  } catch (error) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
});

// Listar documentos de um chamado
router.get('/:id/documents', authenticate, authorize('admin', 'manager', 'technician'), async (req, res, next) => {
  try {
    const documents = await query(
      `SELECT d.*, u.username as uploaded_by_name
       FROM call_documents d
       LEFT JOIN users u ON d.uploaded_by = u.id
       WHERE d.call_id = ?
       ORDER BY d.phase, d.created_at DESC`,
      [req.params.id]
    );

    res.json({
      success: true,
      data: documents,
    });
  } catch (error) {
    next(error);
  }
});

// Download de documento
router.get('/:id/documents/:docId/download', authenticate, authorize('admin', 'manager', 'technician'), async (req, res, next) => {
  try {
    const document = await get(
      'SELECT file_path, file_name FROM call_documents WHERE id = ? AND call_id = ?',
      [req.params.docId, req.params.id]
    );

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Documento não encontrado',
      });
    }

    if (!fs.existsSync(document.file_path)) {
      return res.status(404).json({
        success: false,
        error: 'Arquivo não encontrado no servidor',
      });
    }

    res.download(document.file_path, document.file_name);
  } catch (error) {
    next(error);
  }
});

// Deletar documento
router.delete('/:id/documents/:docId', authenticate, authorize('admin', 'manager', 'technician'), async (req, res, next) => {
  try {
    const document = await get(
      'SELECT file_path FROM call_documents WHERE id = ? AND call_id = ?',
      [req.params.docId, req.params.id]
    );

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Documento não encontrado',
      });
    }

    // Deletar arquivo do sistema de arquivos
    if (fs.existsSync(document.file_path)) {
      fs.unlinkSync(document.file_path);
    }

    // Deletar registro do banco
    await run('DELETE FROM call_documents WHERE id = ? AND call_id = ?', [req.params.docId, req.params.id]);

    res.json({
      success: true,
      message: 'Documento deletado com sucesso',
    });
  } catch (error) {
    next(error);
  }
});

// Servir arquivos estáticos de documentos
router.get('/:id/documents/:docId/view', authenticate, authorize('admin', 'manager', 'technician'), async (req, res, next) => {
  try {
    const document = await get(
      'SELECT file_path, file_type FROM call_documents WHERE id = ? AND call_id = ?',
      [req.params.docId, req.params.id]
    );

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Documento não encontrado',
      });
    }

    if (!fs.existsSync(document.file_path)) {
      return res.status(404).json({
        success: false,
        error: 'Arquivo não encontrado no servidor',
      });
    }

    res.setHeader('Content-Type', document.file_type);
    res.sendFile(path.resolve(document.file_path));
  } catch (error) {
    next(error);
  }
});

module.exports = router;


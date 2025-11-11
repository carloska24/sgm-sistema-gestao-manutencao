const express = require('express');
const router = express.Router();
const { query, get } = require('../database');
const { authenticate, authorize } = require('../middleware/auth');

// Relatório de Conformidade de Manutenções Preventivas
router.get('/compliance', authenticate, authorize('admin', 'manager'), async (req, res, next) => {
  try {
    const { start_date, end_date, equipment_id, include_demo } = req.query;

    // Verificar se há dados reais (sem demo)
    const realEquipmentCount = await get('SELECT COUNT(*) as count FROM equipment WHERE (is_demo = 0 OR is_demo IS NULL)');
    const hasRealData = realEquipmentCount?.count > 0;
    // Se include_demo for 'true', sempre incluir. Se não houver dados reais, incluir automaticamente.
    const shouldIncludeDemo = include_demo === 'true' || (!hasRealData && include_demo !== 'false');
    
    const demoFilterPlans = shouldIncludeDemo ? '' : 'AND (pp.is_demo = 0 OR pp.is_demo IS NULL)';
    const demoFilterEquipment = shouldIncludeDemo ? '' : 'AND (e.is_demo = 0 OR e.is_demo IS NULL)';
    
    // Construir filtro de data para o JOIN
    const params = [];
    const dateConditions = [];
    const demoConditions = [];
    
    if (start_date && end_date) {
      dateConditions.push('DATE(mo.scheduled_date) BETWEEN ? AND ?');
      params.push(start_date, end_date);
    }
    
    // Verificar se a coluna is_demo existe antes de usar
    try {
      const columnCheck = await query(`PRAGMA table_info(maintenance_orders)`);
      const hasIsDemoColumn = Array.isArray(columnCheck) 
        ? columnCheck.some((col) => col.name === 'is_demo')
        : false;
      
      // Se não deve incluir demo e a coluna existe, adicionar filtro de demo nas condições
      if (hasIsDemoColumn && !shouldIncludeDemo) {
      demoConditions.push('(mo.is_demo = 0 OR mo.is_demo IS NULL)');
      }
    } catch (err) {
      console.warn('Não foi possível verificar coluna is_demo:', err);
    }
    
    const allConditions = [...demoConditions, ...dateConditions];
    const demoFilterOrders = allConditions.length > 0 ? 'AND ' + allConditions.join(' AND ') : '';

    let sql = `
      SELECT 
        pp.id as plan_id,
        pp.name as plan_name,
        e.id as equipment_id,
        e.code as equipment_code,
        e.name as equipment_name,
        COUNT(mo.id) as total_scheduled,
        SUM(CASE WHEN mo.status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN mo.status = 'completed' AND DATE(mo.completed_date) <= DATE(mo.scheduled_date) THEN 1 ELSE 0 END) as on_time,
        SUM(CASE WHEN mo.status = 'completed' AND DATE(mo.completed_date) > DATE(mo.scheduled_date) THEN 1 ELSE 0 END) as late,
        SUM(CASE WHEN mo.status = 'pending' AND DATE(mo.scheduled_date) < DATE('now') THEN 1 ELSE 0 END) as overdue
      FROM preventive_plans pp
      LEFT JOIN equipment e ON pp.equipment_id = e.id ${demoFilterEquipment}
      LEFT JOIN maintenance_orders mo ON mo.plan_id = pp.id ${demoFilterOrders}
      WHERE 1=1
      ${demoFilterPlans}
    `;

    if (equipment_id) {
      sql += ' AND e.id = ?';
      params.push(equipment_id);
    }

    // Retornar apenas planos que têm pelo menos uma manutenção agendada
    sql += ' GROUP BY pp.id, e.id HAVING COUNT(mo.id) > 0';

    const results = await query(sql, params);

    const complianceData = results.map((row) => {
      const complianceRate = row.total_scheduled > 0 
        ? (row.completed / row.total_scheduled) * 100 
        : 0;
      
      return {
        ...row,
        compliance_rate: Math.round(complianceRate * 100) / 100,
        on_time_rate: row.completed > 0 
          ? Math.round((row.on_time / row.completed) * 100 * 100) / 100 
          : 0,
      };
    });

    res.json({
      success: true,
      data: complianceData,
    });
  } catch (error) {
    next(error);
  }
});

// Relatório de MTBF e MTTR
router.get('/mtbf-mttr', authenticate, authorize('admin', 'manager'), async (req, res, next) => {
  try {
    const { equipment_id, start_date, end_date, include_demo } = req.query;

    // Verificar se há dados reais (sem demo)
    const realEquipmentCount = await get('SELECT COUNT(*) as count FROM equipment WHERE (is_demo = 0 OR is_demo IS NULL)');
    const hasRealData = realEquipmentCount?.count > 0;
    const shouldIncludeDemo = include_demo === 'true' || (!hasRealData && include_demo !== 'false');
    
    const demoFilter = shouldIncludeDemo ? '' : 'AND (e.is_demo = 0 OR e.is_demo IS NULL) AND (mc.is_demo = 0 OR mc.is_demo IS NULL)';

    let sql = `
      SELECT 
        e.id,
        e.code,
        e.name,
        COUNT(mc.id) as total_calls,
        AVG(mc.execution_time) as avg_mttr,
        MIN(mc.execution_time) as min_mttr,
        MAX(mc.execution_time) as max_mttr
      FROM equipment e
      LEFT JOIN maintenance_calls mc ON mc.equipment_id = e.id
      WHERE mc.status = 'completed'
      ${demoFilter}
    `;

    const params = [];

    if (equipment_id) {
      sql += ' AND e.id = ?';
      params.push(equipment_id);
    }

    if (start_date && end_date) {
      sql += ' AND DATE(mc.completed_at) BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }

    sql += ' GROUP BY e.id';

    const results = await query(sql, params);

    // Calcular MTBF (tempo médio entre falhas)
    const mtbfData = await Promise.all(results.map(async (row) => {
      if (row.total_calls < 2) {
        return {
          ...row,
          mtbf: null,
          mtbf_hours: null,
        };
      }

      // Buscar intervalo entre falhas
      const demoFilterForIntervals = shouldIncludeDemo ? '' : 'AND (is_demo = 0 OR is_demo IS NULL)';
      const intervals = await query(
        `SELECT 
          completed_at,
          LAG(completed_at) OVER (ORDER BY completed_at) as previous_completed
         FROM maintenance_calls
         WHERE equipment_id = ? AND status = 'completed'
         ${demoFilterForIntervals}
         ORDER BY completed_at`,
        [row.id]
      );

      let totalInterval = 0;
      let intervalCount = 0;

      for (let i = 1; i < intervals.length; i++) {
        if (intervals[i].previous_completed) {
          const interval = new Date(intervals[i].completed_at) - new Date(intervals[i].previous_completed);
          totalInterval += interval;
          intervalCount++;
        }
      }

      const mtbf = intervalCount > 0 ? totalInterval / intervalCount : null;
      const mtbfHours = mtbf ? Math.round(mtbf / (1000 * 60 * 60) * 100) / 100 : null;

      return {
        ...row,
        mtbf: mtbfHours,
        mtbf_hours: mtbfHours,
        avg_mttr: Math.round((row.avg_mttr || 0) * 100) / 100,
      };
    }));

    res.json({
      success: true,
      data: mtbfData,
    });
  } catch (error) {
    next(error);
  }
});

// Relatório de Custos de Manutenção
router.get('/costs', authenticate, authorize('admin', 'manager'), async (req, res, next) => {
  try {
    const { start_date, end_date, equipment_id, include_demo } = req.query;

    // Verificar se há dados reais (sem demo)
    const realEquipmentCount = await get('SELECT COUNT(*) as count FROM equipment WHERE (is_demo = 0 OR is_demo IS NULL)');
    const hasRealData = realEquipmentCount?.count > 0;
    const shouldIncludeDemo = include_demo === 'true' || (!hasRealData && include_demo !== 'false');
    
    // Verificar se as colunas is_demo existem antes de usar
    let demoFilter = '';
    if (!shouldIncludeDemo) {
      const filters = [];
      try {
        const equipmentCheck = await query(`PRAGMA table_info(equipment)`);
        const callsCheck = await query(`PRAGMA table_info(maintenance_calls)`);
        const ordersCheck = await query(`PRAGMA table_info(maintenance_orders)`);
        
        const hasEquipmentDemo = Array.isArray(equipmentCheck) && equipmentCheck.some((col) => col.name === 'is_demo');
        const hasCallsDemo = Array.isArray(callsCheck) && callsCheck.some((col) => col.name === 'is_demo');
        const hasOrdersDemo = Array.isArray(ordersCheck) && ordersCheck.some((col) => col.name === 'is_demo');
        
        if (hasEquipmentDemo) filters.push('(e.is_demo = 0 OR e.is_demo IS NULL)');
        if (hasCallsDemo) filters.push('(mc.is_demo = 0 OR mc.is_demo IS NULL)');
        if (hasOrdersDemo) filters.push('(mo.is_demo = 0 OR mo.is_demo IS NULL)');
        
        if (filters.length > 0) {
          demoFilter = 'AND ' + filters.join(' AND ');
        }
      } catch (err) {
        console.warn('Não foi possível verificar colunas is_demo:', err);
      }
    }

    let sql = `
      SELECT 
        e.id as equipment_id,
        e.code,
        e.name,
        COUNT(DISTINCT mc.id) as corrective_count,
        COUNT(DISTINCT mo.id) as preventive_count,
        SUM(mc.execution_time) as total_corrective_time,
        SUM(mo.execution_time) as total_preventive_time
      FROM equipment e
      LEFT JOIN maintenance_calls mc ON mc.equipment_id = e.id AND mc.status = 'completed'
      LEFT JOIN maintenance_orders mo ON mo.equipment_id = e.id AND mo.status = 'completed'
      WHERE 1=1
      ${demoFilter}
    `;

    const params = [];

    if (start_date && end_date) {
      sql += ' AND (DATE(mc.completed_at) BETWEEN ? AND ? OR DATE(mo.completed_date) BETWEEN ? AND ?)';
      params.push(start_date, end_date, start_date, end_date);
    }

    if (equipment_id) {
      sql += ' AND e.id = ?';
      params.push(equipment_id);
    }

    sql += ' GROUP BY e.id';

    const results = await query(sql, params);

    // Calcular custos estimados (baseado em tempo médio)
    const costData = results.map((row) => {
      // Estimativa: R$ 50/hora para manutenção
      const hourlyCost = 50;
      // Garantir que os tempos sejam sempre positivos
      const totalCorrectiveTime = Math.max(0, row.total_corrective_time || 0);
      const totalPreventiveTime = Math.max(0, row.total_preventive_time || 0);
      
      const correctiveHours = totalCorrectiveTime / 60;
      const preventiveHours = totalPreventiveTime / 60;
      
      const correctiveCost = correctiveHours * hourlyCost;
      const preventiveCost = preventiveHours * hourlyCost;
      const totalCost = correctiveCost + preventiveCost;

      return {
        ...row,
        corrective_cost: Math.round(correctiveCost * 100) / 100,
        preventive_cost: Math.round(preventiveCost * 100) / 100,
        total_cost: Math.round(totalCost * 100) / 100,
        corrective_hours: Math.round(correctiveHours * 100) / 100,
        preventive_hours: Math.round(preventiveHours * 100) / 100,
      };
    });

    res.json({
      success: true,
      data: costData,
    });
  } catch (error) {
    next(error);
  }
});

// Relatório de Performance de Técnicos
router.get('/technicians-performance', authenticate, authorize('admin', 'manager'), async (req, res, next) => {
  try {
    const { start_date, end_date, include_demo } = req.query;

    // Verificar se há dados reais (sem demo)
    const realEquipmentCount = await get('SELECT COUNT(*) as count FROM equipment WHERE (is_demo = 0 OR is_demo IS NULL)');
    const hasRealData = realEquipmentCount?.count > 0;
    const shouldIncludeDemo = include_demo === 'true' || (!hasRealData && include_demo !== 'false');
    
    const demoFilter = shouldIncludeDemo ? '' : 'AND (mc.is_demo = 0 OR mc.is_demo IS NULL) AND (mo.is_demo = 0 OR mo.is_demo IS NULL)';

    let sql = `
      SELECT 
        u.id,
        u.username,
        u.full_name,
        COUNT(DISTINCT mc.id) as calls_completed,
        COUNT(DISTINCT mo.id) as preventives_completed,
        AVG(mc.execution_time) as avg_call_time,
        AVG(mo.execution_time) as avg_preventive_time,
        SUM(mc.execution_time) as total_call_time,
        SUM(mo.execution_time) as total_preventive_time
      FROM users u
      LEFT JOIN maintenance_calls mc ON mc.assigned_to = u.id AND mc.status = 'completed'
      LEFT JOIN maintenance_orders mo ON mo.assigned_to = u.id AND mo.status = 'completed'
      WHERE u.role IN ('admin', 'manager', 'technician')
      ${demoFilter}
    `;

    const params = [];

    if (start_date && end_date) {
      sql += ' AND (DATE(mc.completed_at) BETWEEN ? AND ? OR DATE(mo.completed_date) BETWEEN ? AND ?)';
      params.push(start_date, end_date, start_date, end_date);
    }

    sql += ' GROUP BY u.id HAVING (calls_completed > 0 OR preventives_completed > 0)';

    const results = await query(sql, params);

    const performanceData = results.map((row) => {
      // Garantir que os tempos sejam sempre positivos (execution_time está em minutos)
      const totalCallTimeMinutes = Math.max(0, row.total_call_time || 0);
      const totalPreventiveTimeMinutes = Math.max(0, row.total_preventive_time || 0);
      const avgCallTimeMinutes = row.calls_completed > 0 ? Math.max(0, row.avg_call_time || 0) : 0;
      const avgPreventiveTimeMinutes = row.preventives_completed > 0 ? Math.max(0, row.avg_preventive_time || 0) : 0;
      
      // Converter minutos para horas
      const totalCallTimeHours = totalCallTimeMinutes / 60;
      const totalPreventiveTimeHours = totalPreventiveTimeMinutes / 60;
      const avgCallTimeHours = avgCallTimeMinutes / 60;
      const avgPreventiveTimeHours = avgPreventiveTimeMinutes / 60;
      const totalHours = totalCallTimeHours + totalPreventiveTimeHours;
      
      const totalCompleted = (row.calls_completed || 0) + (row.preventives_completed || 0);
      
      // Calcular eficiência (tarefas por hora)
      const efficiency = totalHours > 0 ? totalCompleted / totalHours : 0;
      
      return {
        ...row,
        total_completed: totalCompleted,
        calls_completed: row.calls_completed || 0,
        preventives_completed: row.preventives_completed || 0,
        // Tempos em horas (já convertidos)
        avg_call_time_hours: Math.round(avgCallTimeHours * 100) / 100,
        avg_preventive_time_hours: Math.round(avgPreventiveTimeHours * 100) / 100,
        total_call_time_hours: Math.round(totalCallTimeHours * 100) / 100,
        total_preventive_time_hours: Math.round(totalPreventiveTimeHours * 100) / 100,
        total_hours: Math.round(totalHours * 100) / 100,
        efficiency: Math.round(efficiency * 100) / 100,
        // Manter valores originais em minutos para referência (se necessário)
        avg_call_time_minutes: Math.round(avgCallTimeMinutes),
        avg_preventive_time_minutes: Math.round(avgPreventiveTimeMinutes),
      };
    });

    res.json({
      success: true,
      data: performanceData,
    });
  } catch (error) {
    next(error);
  }
});

// Relatório de Chamados por Período
router.get('/calls-by-period', authenticate, authorize('admin', 'manager'), async (req, res, next) => {
  try {
    const { start_date, end_date, group_by = 'day', include_demo } = req.query;

    // Verificar se há dados reais (sem demo)
    const realEquipmentCount = await get('SELECT COUNT(*) as count FROM equipment WHERE (is_demo = 0 OR is_demo IS NULL)');
    const hasRealData = realEquipmentCount?.count > 0;
    const shouldIncludeDemo = include_demo === 'true' || (!hasRealData && include_demo !== 'false');
    
    const demoFilter = shouldIncludeDemo ? '' : 'AND (is_demo = 0 OR is_demo IS NULL)';

    let dateFormat;
    if (group_by === 'day') {
      dateFormat = "DATE(created_at)";
    } else if (group_by === 'week') {
      dateFormat = "strftime('%Y-W%W', created_at)";
    } else if (group_by === 'month') {
      dateFormat = "strftime('%Y-%m', created_at)";
    } else {
      dateFormat = "DATE(created_at)";
    }

    let sql = `
      SELECT 
        ${dateFormat} as period,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN priority = 'urgent' THEN 1 ELSE 0 END) as urgent,
        SUM(CASE WHEN priority = 'high' THEN 1 ELSE 0 END) as high,
        SUM(CASE WHEN priority = 'medium' THEN 1 ELSE 0 END) as medium,
        SUM(CASE WHEN priority = 'low' THEN 1 ELSE 0 END) as low
      FROM maintenance_calls
      WHERE 1=1
      ${demoFilter}
    `;

    const params = [];

    if (start_date && end_date) {
      sql += ' AND DATE(created_at) BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }

    sql += ` GROUP BY ${dateFormat} ORDER BY period ASC`;

    const results = await query(sql, params);

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    next(error);
  }
});

// Relatório de Equipamentos Mais Críticos
router.get('/critical-equipment', authenticate, authorize('admin', 'manager'), async (req, res, next) => {
  try {
    const { start_date, end_date, limit = 10, include_demo } = req.query;

    // Verificar se há dados reais (sem demo)
    const realEquipmentCount = await get('SELECT COUNT(*) as count FROM equipment WHERE (is_demo = 0 OR is_demo IS NULL)');
    const hasRealData = realEquipmentCount?.count > 0;
    const shouldIncludeDemo = include_demo === 'true' || (!hasRealData && include_demo !== 'false');
    
    const demoFilter = shouldIncludeDemo ? '' : 'AND (e.is_demo = 0 OR e.is_demo IS NULL) AND (mc.is_demo = 0 OR mc.is_demo IS NULL)';

    let sql = `
      SELECT 
        e.id,
        e.code,
        e.name,
        e.criticality,
        COUNT(DISTINCT mc.id) as total_calls,
        AVG(mc.execution_time) as avg_mttr,
        SUM(CASE WHEN mc.status = 'open' THEN 1 ELSE 0 END) as open_calls,
        SUM(CASE WHEN mc.status = 'completed' THEN 1 ELSE 0 END) as completed_calls
      FROM equipment e
      LEFT JOIN maintenance_calls mc ON mc.equipment_id = e.id
      WHERE 1=1
      ${demoFilter}
    `;

    const params = [];

    if (start_date && end_date) {
      sql += ' AND DATE(mc.created_at) BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }

    sql += ' GROUP BY e.id ORDER BY total_calls DESC, e.criticality DESC LIMIT ?';
    params.push(parseInt(limit));

    const results = await query(sql, params);

    const criticalData = results.map((row) => ({
      ...row,
      avg_mttr: Math.round((row.avg_mttr || 0) * 100) / 100,
    }));

    res.json({
      success: true,
      data: criticalData,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;


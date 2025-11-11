const express = require('express');
const router = express.Router();
const { query, get } = require('../database');
const { authenticate } = require('../middleware/auth');

// Estatísticas do dashboard
router.get('/stats', authenticate, async (req, res, next) => {
  try {
    const { include_demo } = req.query;
    
    // Verificar se há dados reais (sem demo)
    const realEquipmentCount = await get('SELECT COUNT(*) as count FROM equipment WHERE (is_demo = 0 OR is_demo IS NULL)');
    const hasRealData = realEquipmentCount?.count > 0;
    
    // Se não há dados reais E include_demo não foi especificado, mostrar demo também
    // Se include_demo=true, sempre mostrar demo
    const shouldIncludeDemo = include_demo === 'true' || (!hasRealData && include_demo !== 'false');
    
    const demoFilter = shouldIncludeDemo ? '' : 'AND (is_demo = 0 OR is_demo IS NULL)';
    const equipmentWhere = shouldIncludeDemo ? '' : 'WHERE (is_demo = 0 OR is_demo IS NULL)';
    const callsWhere = shouldIncludeDemo ? '' : 'WHERE (is_demo = 0 OR is_demo IS NULL)';
    
    // Verificar se a coluna is_demo existe na tabela maintenance_orders antes de usar
    let ordersFilter = '';
    if (!shouldIncludeDemo) {
      try {
        const columnCheck = await query(`PRAGMA table_info(maintenance_orders)`);
        const hasIsDemoColumn = Array.isArray(columnCheck) 
          ? columnCheck.some((col) => col.name === 'is_demo')
          : false;
        
        if (hasIsDemoColumn) {
          ordersFilter = 'AND (is_demo = 0 OR is_demo IS NULL)';
        }
      } catch (err) {
        console.warn('Não foi possível verificar coluna is_demo:', err);
      }
    }
    
    const stats = {
      totalEquipment: 0,
      activeEquipment: 0,
      inactiveEquipment: 0,
      openCalls: 0,
      inProgressCalls: 0,
      pendingPreventives: 0,
      overduePreventives: 0,
      complianceRate: 0,
      avgMTBF: 0,
      avgMTTR: 0,
    };

    // Total de equipamentos
    const totalEquipment = await get(`SELECT COUNT(*) as count FROM equipment ${equipmentWhere}`);
    stats.totalEquipment = totalEquipment?.count || 0;

    // Equipamentos ativos
    const activeEquipment = await get(`SELECT COUNT(*) as count FROM equipment WHERE status = 'active' ${demoFilter}`);
    stats.activeEquipment = activeEquipment?.count || 0;

    // Equipamentos inativos
    const inactiveEquipment = await get(`SELECT COUNT(*) as count FROM equipment WHERE status IN ('inactive', 'deactivated') ${demoFilter}`);
    stats.inactiveEquipment = inactiveEquipment?.count || 0;

    // Chamados abertos
    const openCallsWhere = shouldIncludeDemo 
      ? "WHERE status IN ('open', 'analysis', 'assigned')"
      : "WHERE (is_demo = 0 OR is_demo IS NULL) AND status IN ('open', 'analysis', 'assigned')";
    const openCalls = await get(`SELECT COUNT(*) as count FROM maintenance_calls ${openCallsWhere}`);
    stats.openCalls = openCalls?.count || 0;

    // Chamados em execução
    const executionCallsWhere = shouldIncludeDemo 
      ? "WHERE status = 'execution'"
      : "WHERE (is_demo = 0 OR is_demo IS NULL) AND status = 'execution'";
    const inProgressCalls = await get(`SELECT COUNT(*) as count FROM maintenance_calls ${executionCallsWhere}`);
    stats.inProgressCalls = inProgressCalls?.count || 0;

    // Preventivas pendentes
    const pendingPreventives = await get(`SELECT COUNT(*) as count FROM maintenance_orders WHERE status = 'pending' ${ordersFilter}`);
    stats.pendingPreventives = pendingPreventives?.count || 0;

    // Preventivas atrasadas
    const overduePreventives = await get(`
      SELECT COUNT(*) as count 
      FROM maintenance_orders 
      WHERE status = 'pending' 
      AND DATE(scheduled_date) < DATE('now')
      ${ordersFilter}
    `);
    stats.overduePreventives = overduePreventives?.count || 0;

    // Taxa de conformidade (preventivas concluídas no prazo)
    const totalPreventives = await get(`SELECT COUNT(*) as count FROM maintenance_orders WHERE status = 'completed' ${ordersFilter}`);
    const onTimePreventives = await get(`
      SELECT COUNT(*) as count 
      FROM maintenance_orders 
      WHERE status = 'completed' 
      AND DATE(completed_date) <= DATE(scheduled_date)
      ${ordersFilter}
    `);
    
    const total = totalPreventives?.count || 0;
    const onTime = onTimePreventives?.count || 0;
    stats.complianceRate = total > 0 ? Math.round((onTime / total) * 100) : 0;

    // MTTR médio (tempo médio de reparo)
    const mttrWhere = shouldIncludeDemo 
      ? "WHERE status = 'completed' AND execution_time IS NOT NULL"
      : "WHERE (is_demo = 0 OR is_demo IS NULL) AND status = 'completed' AND execution_time IS NOT NULL";
    const avgMTTR = await get(`SELECT AVG(execution_time) as avg FROM maintenance_calls ${mttrWhere}`);
    stats.avgMTTR = Math.round((avgMTTR?.avg || 0) * 100) / 100;

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
});

// Gráfico de chamados por status
router.get('/calls-by-status', authenticate, async (req, res, next) => {
  try {
    const { include_demo } = req.query;
    const realEquipmentCount = await get('SELECT COUNT(*) as count FROM equipment WHERE (is_demo = 0 OR is_demo IS NULL)');
    const hasRealData = realEquipmentCount?.count > 0;
    const shouldIncludeDemo = include_demo === 'true' || (!hasRealData && include_demo !== 'false');
    const demoFilter = shouldIncludeDemo ? '' : 'WHERE (is_demo = 0 OR is_demo IS NULL)';
    
    const data = await query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM maintenance_calls
      ${demoFilter}
      GROUP BY status
    `);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
});

// Gráfico de chamados por período
router.get('/calls-by-period', authenticate, async (req, res, next) => {
  try {
    const { days = 30, include_demo } = req.query;
    const realEquipmentCount = await get('SELECT COUNT(*) as count FROM equipment WHERE (is_demo = 0 OR is_demo IS NULL)');
    const hasRealData = realEquipmentCount?.count > 0;
    const shouldIncludeDemo = include_demo === 'true' || (!hasRealData && include_demo !== 'false');
    const demoFilter = shouldIncludeDemo ? '' : 'AND (is_demo = 0 OR is_demo IS NULL)';

    const data = await query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM maintenance_calls
      WHERE DATE(created_at) >= DATE('now', '-' || ? || ' days')
      ${demoFilter}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `, [days]);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
});

// Gráfico de preventivas por status
router.get('/preventives-by-status', authenticate, async (req, res, next) => {
  try {
    const { include_demo } = req.query;
    const realEquipmentCount = await get('SELECT COUNT(*) as count FROM equipment WHERE (is_demo = 0 OR is_demo IS NULL)');
    const hasRealData = realEquipmentCount?.count > 0;
    const shouldIncludeDemo = include_demo === 'true' || (!hasRealData && include_demo !== 'false');
    const demoFilter = shouldIncludeDemo ? '' : 'AND (is_demo = 0 OR is_demo IS NULL)';
    
    const data = await query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM maintenance_orders
      WHERE type = 'preventive'
      ${demoFilter}
      GROUP BY status
    `);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
});

// Gráfico de equipamentos por status
router.get('/equipment-by-status', authenticate, async (req, res, next) => {
  try {
    const { include_demo } = req.query;
    const realEquipmentCount = await get('SELECT COUNT(*) as count FROM equipment WHERE (is_demo = 0 OR is_demo IS NULL)');
    const hasRealData = realEquipmentCount?.count > 0;
    const shouldIncludeDemo = include_demo === 'true' || (!hasRealData && include_demo !== 'false');
    const demoFilter = shouldIncludeDemo ? '' : 'WHERE (is_demo = 0 OR is_demo IS NULL)';
    
    const data = await query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM equipment
      ${demoFilter}
      GROUP BY status
    `);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;


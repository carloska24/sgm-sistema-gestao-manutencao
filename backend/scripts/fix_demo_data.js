const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'sgm.db');

// Conectar ao banco de dados
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Erro ao conectar ao banco de dados:', err);
    process.exit(1);
  } else {
    console.log('✅ Conectado ao banco de dados SQLite');
    main();
  }
});

async function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

async function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ lastID: this.lastID, changes: this.changes });
      }
    });
  });
}

async function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

async function main() {
  try {
    console.log('\n🔧 Iniciando correção de dados demo...\n');

    // 1. Buscar usuário admin para atribuir às manutenções
    const adminUser = await get('SELECT id FROM users WHERE role = ? LIMIT 1', ['admin']);
    if (!adminUser) {
      console.log('⚠️  Nenhum usuário admin encontrado. Pulando atribuições.');
    }
    const assignedUserId = adminUser?.id || null;

    // 2. Corrigir ordens de manutenção demo
    console.log('📋 Corrigindo ordens de manutenção demo...');
    
    const orders = await query(`
      SELECT id, plan_id, scheduled_date, completed_date, started_at, execution_time, status, assigned_to
      FROM maintenance_orders
      WHERE is_demo = 1
    `);

    let ordersFixed = 0;
    for (const order of orders) {
      let needsUpdate = false;
      const updates = [];
      const params = [];

      // Corrigir execution_time negativo ou nulo
      if (order.status === 'completed' && (!order.execution_time || order.execution_time <= 0)) {
        if (order.started_at && order.completed_date) {
          const startTime = new Date(order.started_at);
          const endTime = new Date(order.completed_date);
          const executionTime = Math.max(60, Math.round((endTime - startTime) / 1000 / 60)); // Mínimo 60 minutos
          updates.push('execution_time = ?');
          params.push(executionTime);
          needsUpdate = true;
        } else {
          // Se não tem datas, usar duração estimada do plano
          const plan = await get('SELECT estimated_duration FROM preventive_plans WHERE id = ?', [order.plan_id]);
          const estimatedDuration = plan?.estimated_duration || 120;
          const variation = 1 + (Math.random() * 0.4 - 0.2); // 0.8 a 1.2
          const executionTime = Math.round(estimatedDuration * variation);
          updates.push('execution_time = ?');
          params.push(executionTime);
          needsUpdate = true;
        }
      }

      // Corrigir datas inconsistentes
      if (order.started_at && order.completed_date) {
        const startTime = new Date(order.started_at);
        const endTime = new Date(order.completed_date);
        if (endTime <= startTime) {
          // Ajustar completed_date para pelo menos 1 hora depois de started_at
          const newCompletedDate = new Date(startTime.getTime() + 60 * 60 * 1000);
          updates.push('completed_date = ?');
          params.push(newCompletedDate.toISOString());
          needsUpdate = true;
        }
      }

      // Atribuir técnico se estiver concluído ou em progresso sem assigned_to
      if ((order.status === 'completed' || order.status === 'in_progress') && !order.assigned_to && assignedUserId) {
        updates.push('assigned_to = ?');
        params.push(assignedUserId);
        needsUpdate = true;
      }

      if (needsUpdate) {
        params.push(order.id);
        await run(
          `UPDATE maintenance_orders SET ${updates.join(', ')} WHERE id = ?`,
          params
        );
        ordersFixed++;
      }
    }

    console.log(`✅ ${ordersFixed} ordem(ns) de manutenção corrigida(s)\n`);

    // 3. Corrigir chamados demo
    console.log('📞 Corrigindo chamados demo...');
    
    const calls = await query(`
      SELECT id, occurrence_date, completed_at, execution_time, status, assigned_to
      FROM maintenance_calls
      WHERE is_demo = 1
    `);

    let callsFixed = 0;
    for (const call of calls) {
      let needsUpdate = false;
      const updates = [];
      const params = [];

      // Corrigir execution_time negativo ou nulo
      if (call.status === 'completed' && (!call.execution_time || call.execution_time <= 0)) {
        if (call.occurrence_date && call.completed_at) {
          const occurrenceTime = new Date(call.occurrence_date);
          const completedTime = new Date(call.completed_at);
          const executionTime = Math.max(30, Math.round((completedTime - occurrenceTime) / 1000 / 60)); // Mínimo 30 minutos
          updates.push('execution_time = ?');
          params.push(executionTime);
          needsUpdate = true;
        } else {
          // Valor padrão baseado em prioridade (já definido nos dados demo)
          const baseTime = 120 + Math.floor(Math.random() * 60);
          updates.push('execution_time = ?');
          params.push(baseTime);
          needsUpdate = true;
        }
      }

      // Corrigir datas inconsistentes
      if (call.occurrence_date && call.completed_at) {
        const occurrenceTime = new Date(call.occurrence_date);
        const completedTime = new Date(call.completed_at);
        if (completedTime <= occurrenceTime) {
          // Ajustar completed_at para pelo menos 1 hora depois de occurrence_date
          const newCompletedAt = new Date(occurrenceTime.getTime() + 60 * 60 * 1000);
          updates.push('completed_at = ?');
          params.push(newCompletedAt.toISOString());
          needsUpdate = true;
        }
      }

      // Atribuir técnico se estiver concluído ou em execução sem assigned_to
      if ((call.status === 'completed' || call.status === 'execution') && !call.assigned_to && assignedUserId) {
        updates.push('assigned_to = ?');
        params.push(assignedUserId);
        needsUpdate = true;
      }

      if (needsUpdate) {
        params.push(call.id);
        await run(
          `UPDATE maintenance_calls SET ${updates.join(', ')} WHERE id = ?`,
          params
        );
        callsFixed++;
      }
    }

    console.log(`✅ ${callsFixed} chamado(s) corrigido(s)\n`);

    // 4. Verificar resultados
    console.log('📊 Verificando dados corrigidos...\n');
    
    const negativeOrders = await query(`
      SELECT COUNT(*) as count FROM maintenance_orders 
      WHERE is_demo = 1 AND execution_time < 0
    `);
    console.log(`   Ordens com execution_time negativo: ${negativeOrders[0].count}`);

    const negativeCalls = await query(`
      SELECT COUNT(*) as count FROM maintenance_calls 
      WHERE is_demo = 1 AND execution_time < 0
    `);
    console.log(`   Chamados com execution_time negativo: ${negativeCalls[0].count}`);

    const ordersWithoutAssigned = await query(`
      SELECT COUNT(*) as count FROM maintenance_orders 
      WHERE is_demo = 1 AND status IN ('completed', 'in_progress') AND assigned_to IS NULL
    `);
    console.log(`   Ordens concluídas sem técnico: ${ordersWithoutAssigned[0].count}`);

    const callsWithoutAssigned = await query(`
      SELECT COUNT(*) as count FROM maintenance_calls 
      WHERE is_demo = 1 AND status IN ('completed', 'execution') AND assigned_to IS NULL
    `);
    console.log(`   Chamados concluídos sem técnico: ${callsWithoutAssigned[0].count}`);

    db.close();
    console.log('\n✅ Correção de dados demo concluída!');
  } catch (error) {
    console.error('❌ Erro ao corrigir dados demo:', error);
    db.close();
    process.exit(1);
  }
}


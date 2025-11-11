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

async function main() {
  try {
    console.log('\n🔍 Buscando manutenções preventivas de demonstração...\n');

    // Primeiro, vamos listar todas as manutenções preventivas
    const allOrders = await query(`
      SELECT 
        mo.id,
        mo.scheduled_date,
        mo.description,
        mo.status,
        mo.is_demo,
        e.name as equipment_name,
        e.code as equipment_code,
        pp.name as plan_name
      FROM maintenance_orders mo
      LEFT JOIN equipment e ON mo.equipment_id = e.id
      LEFT JOIN preventive_plans pp ON mo.plan_id = pp.id
      WHERE mo.type = 'preventive'
      ORDER BY mo.scheduled_date ASC
    `);

    console.log(`📊 Total de manutenções preventivas encontradas: ${allOrders.length}\n`);

    if (allOrders.length === 0) {
      console.log('ℹ️  Nenhuma manutenção preventiva encontrada.');
      db.close();
      return;
    }

    // Obter o mês atual do calendário (assumindo que é novembro de 2025 baseado no output anterior)
    const today = new Date();
    let targetMonth = today.getMonth() + 1;
    let targetYear = today.getFullYear();

    // Se não houver manutenções no mês atual, verificar o mês das manutenções existentes
    const firstOrderDate = new Date(allOrders[0].scheduled_date);
    if (firstOrderDate.getMonth() + 1 !== targetMonth || firstOrderDate.getFullYear() !== targetYear) {
      targetMonth = firstOrderDate.getMonth() + 1;
      targetYear = firstOrderDate.getFullYear();
      console.log(`📅 Usando mês das manutenções: ${targetMonth}/${targetYear}\n`);
    }

    // Verificar especificamente os dias 5, 6, 12, 13, 16
    const targetDays = [5, 6, 12, 13, 16];
    const ordersToDelete = [];

    console.log(`🎯 Verificando manutenções nos dias 5, 6, 12, 13 e 16 do mês ${targetMonth}/${targetYear}:\n`);

    for (const day of targetDays) {
      const dateStr = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      const ordersOnDate = await query(`
        SELECT 
          mo.id,
          mo.scheduled_date,
          mo.description,
          mo.status,
          mo.is_demo,
          e.name as equipment_name,
          e.code as equipment_code
        FROM maintenance_orders mo
        LEFT JOIN equipment e ON mo.equipment_id = e.id
        WHERE mo.type = 'preventive'
        AND DATE(mo.scheduled_date) = ?
        ORDER BY mo.scheduled_date ASC
      `, [dateStr]);

      if (ordersOnDate.length > 0) {
        console.log(`📌 Dia ${day}/${targetMonth}/${targetYear}: ${ordersOnDate.length} manutenção(ões) encontrada(s)`);
        ordersOnDate.forEach(order => {
          const date = new Date(order.scheduled_date);
          console.log(`   - ID: ${order.id} | Data: ${date.toLocaleDateString('pt-BR')} | Equipamento: ${order.equipment_name || order.equipment_code || 'N/A'} | Status: ${order.status} | Descrição: ${order.description || 'N/A'}`);
          ordersToDelete.push(order.id);
        });
      } else {
        console.log(`📌 Dia ${day}/${targetMonth}/${targetYear}: Nenhuma manutenção encontrada`);
      }
    }

    if (ordersToDelete.length === 0) {
      console.log('\n⚠️  Nenhuma manutenção encontrada nas datas especificadas (dias 5, 6, 12, 13, 16).');
      db.close();
      return;
    }

    console.log(`\n🗑️  Removendo ${ordersToDelete.length} manutenção(ões) preventiva(s) de demonstração...\n`);
    
    // Remover as manutenções específicas
    const placeholders = ordersToDelete.map(() => '?').join(',');
    const result = await run(`
      DELETE FROM maintenance_orders
      WHERE id IN (${placeholders})
    `, ordersToDelete);

    console.log(`✅ ${result.changes} manutenção(ões) preventiva(s) removida(s) do banco de dados.`);

    // Verificar se também precisamos remover do histórico
    const historyResult = await run(`
      DELETE FROM maintenance_history
      WHERE order_id IN (${placeholders})
    `, ordersToDelete);

    if (historyResult.changes > 0) {
      console.log(`✅ ${historyResult.changes} registro(s) de histórico removido(s).`);
    }

    db.close();
    console.log('\n✅ Processo concluído!');
  } catch (error) {
    console.error('❌ Erro ao processar:', error);
    db.close();
    process.exit(1);
  }
}


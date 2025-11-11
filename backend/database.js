const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'sgm.db');

// Garantir que o diretório existe
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Erro ao conectar ao banco de dados:', err);
  } else {
    console.log('✅ Conectado ao banco de dados SQLite');
    initializeDatabase();
  }
});

// Função helper para verificar se uma coluna existe
function columnExists(tableName, columnName, callback) {
  db.all(`PRAGMA table_info(${tableName})`, (err, rows) => {
    if (err) {
      callback(err, false);
      return;
    }
    const exists = rows.some(row => row.name === columnName);
    callback(null, exists);
  });
}

// Função helper para adicionar coluna se não existir
function addColumnIfNotExists(tableName, columnName, columnDefinition, callback) {
  columnExists(tableName, columnName, (err, exists) => {
    if (err) {
      callback(err);
      return;
    }
    if (!exists) {
      db.run(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`, (err) => {
        if (err && !err.message.includes('duplicate column')) {
          callback(err);
        } else {
          callback(null);
        }
      });
    } else {
      callback(null);
    }
  });
}

function initializeDatabase() {
  // Tabela de usuários
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'requester',
      full_name TEXT,
      department TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Adicionar colunas se não existirem (migração)
  db.run(`ALTER TABLE users ADD COLUMN full_name TEXT`, () => {});
  db.run(`ALTER TABLE users ADD COLUMN department TEXT`, () => {});
  db.run(`ALTER TABLE users ADD COLUMN photo_url LONGTEXT`, () => {});

  // Tabela de equipamentos
  db.run(`
    CREATE TABLE IF NOT EXISTS equipment (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      description TEXT,
      model TEXT,
      manufacturer TEXT,
      serial_number TEXT,
      acquisition_date DATE,
      acquisition_cost DECIMAL(10,2),
      location TEXT,
      status TEXT DEFAULT 'active',
      criticality TEXT DEFAULT 'medium',
      -- Características técnicas
      power TEXT,
      capacity TEXT,
      voltage TEXT,
      fuel_type TEXT,
      dimensions TEXT,
      -- Informações de manutenção
      last_preventive_date DATETIME,
      last_corrective_date DATETIME,
      next_preventive_date DATETIME,
      mtbf DECIMAL(10,2),
      mttr DECIMAL(10,2),
      is_demo INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Adicionar colunas se não existirem (migração)
  // SQLite não suporta UNIQUE em ALTER TABLE, então adicionamos sem UNIQUE
  // Se a tabela já existir sem code, precisamos recriar ou adicionar sem constraint
  addColumnIfNotExists('equipment', 'code', 'TEXT', (err) => {
    if (err) {
      console.error('Erro ao adicionar coluna code:', err);
    } else {
      // Atualizar registros existentes sem code
      db.run(`UPDATE equipment SET code = 'EQ-' || id WHERE code IS NULL OR code = ''`, () => {});
      // Criar índice único para garantir unicidade
      db.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_equipment_code ON equipment(code)`, () => {});
    }
  });
  addColumnIfNotExists('equipment', 'acquisition_date', 'DATE', () => {});
  addColumnIfNotExists('equipment', 'acquisition_cost', 'DECIMAL(10,2)', () => {});
  addColumnIfNotExists('equipment', 'criticality', "TEXT DEFAULT 'medium'", () => {});
  addColumnIfNotExists('equipment', 'power', 'TEXT', () => {});
  addColumnIfNotExists('equipment', 'capacity', 'TEXT', () => {});
  addColumnIfNotExists('equipment', 'voltage', 'TEXT', () => {});
  addColumnIfNotExists('equipment', 'fuel_type', 'TEXT', () => {});
  addColumnIfNotExists('equipment', 'dimensions', 'TEXT', () => {});
  addColumnIfNotExists('equipment', 'last_preventive_date', 'DATETIME', () => {});
  addColumnIfNotExists('equipment', 'last_corrective_date', 'DATETIME', () => {});
  addColumnIfNotExists('equipment', 'next_preventive_date', 'DATETIME', () => {});
  addColumnIfNotExists('equipment', 'mtbf', 'DECIMAL(10,2)', () => {});
  addColumnIfNotExists('equipment', 'mttr', 'DECIMAL(10,2)', () => {});
  addColumnIfNotExists('equipment', 'is_demo', 'INTEGER DEFAULT 0', () => {});
  
  // Renomear tag para code se necessário (após garantir que code existe)
  setTimeout(() => {
    db.run(`UPDATE equipment SET code = tag WHERE code IS NULL AND tag IS NOT NULL`, () => {});
  }, 100);

  // Tabela de documentos de equipamentos
  db.run(`
    CREATE TABLE IF NOT EXISTS equipment_documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      equipment_id INTEGER NOT NULL,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_size INTEGER,
      document_type TEXT,
      uploaded_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
      FOREIGN KEY (uploaded_by) REFERENCES users(id)
    )
  `);

  // Tabela de chamados de manutenção corretiva
  db.run(`
    CREATE TABLE IF NOT EXISTS maintenance_calls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      equipment_id INTEGER NOT NULL,
      type TEXT NOT NULL DEFAULT 'corrective',
      priority TEXT DEFAULT 'medium',
      problem_type TEXT,
      description TEXT NOT NULL,
      occurrence_date DATETIME,
      status TEXT DEFAULT 'open',
      assigned_to INTEGER,
      assigned_at DATETIME,
      started_at DATETIME,
      completed_at DATETIME,
      execution_time INTEGER,
      created_by INTEGER NOT NULL,
      is_demo INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (equipment_id) REFERENCES equipment(id),
      FOREIGN KEY (assigned_to) REFERENCES users(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);
  
  // Migração: adicionar coluna is_demo se não existir
  addColumnIfNotExists('maintenance_calls', 'is_demo', 'INTEGER DEFAULT 0', () => {});
  
  // Migração: adicionar colunas de pausa para chamados
  addColumnIfNotExists('maintenance_calls', 'paused_at', 'DATETIME', () => {});
  addColumnIfNotExists('maintenance_calls', 'pause_reason', 'TEXT', () => {});
  addColumnIfNotExists('maintenance_calls', 'total_paused_time', 'INTEGER DEFAULT 0', () => {});
  addColumnIfNotExists('maintenance_calls', 'resume_count', 'INTEGER DEFAULT 0', () => {});
  
  // Migração: adicionar colunas para observações e peças utilizadas
  addColumnIfNotExists('maintenance_calls', 'execution_notes', 'TEXT', () => {});
  addColumnIfNotExists('maintenance_calls', 'parts_used', 'TEXT', () => {});

  // Tabela de atividades de chamados
  db.run(`
    CREATE TABLE IF NOT EXISTS call_activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      call_id INTEGER NOT NULL,
      activity TEXT NOT NULL,
      performed_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (call_id) REFERENCES maintenance_calls(id) ON DELETE CASCADE,
      FOREIGN KEY (performed_by) REFERENCES users(id)
    )
  `);

  // Tabela de histórico/logs de chamados
  db.run(`
    CREATE TABLE IF NOT EXISTS call_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      call_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      old_value TEXT,
      new_value TEXT,
      performed_by INTEGER,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (call_id) REFERENCES maintenance_calls(id) ON DELETE CASCADE,
      FOREIGN KEY (performed_by) REFERENCES users(id)
    )
  `);

  // Tabela de documentos/fotos de chamados
  db.run(`
    CREATE TABLE IF NOT EXISTS call_documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      call_id INTEGER NOT NULL,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_size INTEGER,
      document_type TEXT DEFAULT 'photo',
      phase TEXT DEFAULT 'during',
      uploaded_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (call_id) REFERENCES maintenance_calls(id) ON DELETE CASCADE,
      FOREIGN KEY (uploaded_by) REFERENCES users(id)
    )
  `);

  // Tabela de planos de manutenção preventiva
  db.run(`
    CREATE TABLE IF NOT EXISTS preventive_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      equipment_id INTEGER NOT NULL,
      frequency_type TEXT NOT NULL,
      frequency_value INTEGER NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE,
      instructions TEXT,
      estimated_duration INTEGER,
      assigned_to INTEGER,
      is_active INTEGER DEFAULT 1,
      is_demo INTEGER DEFAULT 0,
      created_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (equipment_id) REFERENCES equipment(id),
      FOREIGN KEY (assigned_to) REFERENCES users(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);
  
  // Migração: adicionar colunas se não existirem
  addColumnIfNotExists('preventive_plans', 'tools_required', 'TEXT', () => {});
  addColumnIfNotExists('preventive_plans', 'materials_required', 'TEXT', () => {});
  addColumnIfNotExists('preventive_plans', 'safety_procedures', 'TEXT', () => {});
  addColumnIfNotExists('preventive_plans', 'manual_reference', 'TEXT', () => {});
  addColumnIfNotExists('preventive_plans', 'is_demo', 'INTEGER DEFAULT 0', () => {});

  // Tabela de ordens de manutenção preventiva (geradas a partir dos planos)
  db.run(`
    CREATE TABLE IF NOT EXISTS maintenance_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plan_id INTEGER,
      equipment_id INTEGER NOT NULL,
      type TEXT NOT NULL DEFAULT 'preventive',
      priority TEXT DEFAULT 'medium',
      description TEXT,
      instructions TEXT,
      status TEXT DEFAULT 'pending',
      assigned_to INTEGER,
      scheduled_date DATETIME NOT NULL,
      completed_date DATETIME,
      execution_time INTEGER,
      created_by INTEGER,
      is_demo INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (plan_id) REFERENCES preventive_plans(id) ON DELETE SET NULL,
      FOREIGN KEY (equipment_id) REFERENCES equipment(id),
      FOREIGN KEY (assigned_to) REFERENCES users(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);
  
  // Migração: adicionar colunas se não existirem
  addColumnIfNotExists('maintenance_orders', 'plan_id', 'INTEGER', () => {});
  addColumnIfNotExists('maintenance_orders', 'instructions', 'TEXT', () => {});
  addColumnIfNotExists('maintenance_orders', 'started_at', 'DATETIME', () => {});
  addColumnIfNotExists('maintenance_orders', 'execution_time', 'INTEGER', () => {});
  addColumnIfNotExists('maintenance_orders', 'observations', 'TEXT', () => {});
  addColumnIfNotExists('maintenance_orders', 'parts_used', 'TEXT', () => {});
  addColumnIfNotExists('maintenance_orders', 'pause_reason', 'TEXT', () => {});
  addColumnIfNotExists('maintenance_orders', 'paused_at', 'DATETIME', () => {});
  addColumnIfNotExists('maintenance_orders', 'resume_count', 'INTEGER DEFAULT 0', () => {});
  addColumnIfNotExists('maintenance_orders', 'total_paused_time', 'INTEGER DEFAULT 0', () => {});
  addColumnIfNotExists('maintenance_orders', 'cancel_reason', 'TEXT', () => {});
  addColumnIfNotExists('maintenance_orders', 'cancelled_at', 'DATETIME', () => {});
  addColumnIfNotExists('maintenance_orders', 'cancelled_by', 'INTEGER', () => {});
  addColumnIfNotExists('maintenance_orders', 'is_demo', 'INTEGER DEFAULT 0', () => {});

  // Tabela de histórico de manutenção
  db.run(`
    CREATE TABLE IF NOT EXISTS maintenance_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      equipment_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      notes TEXT,
      performed_by INTEGER,
      performed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES maintenance_orders(id),
      FOREIGN KEY (equipment_id) REFERENCES equipment(id),
      FOREIGN KEY (performed_by) REFERENCES users(id)
    )
  `);

  // Tabelas de checklists inteligentes
  db.run(`
    CREATE TABLE IF NOT EXISTS checklist_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      entity_type TEXT NOT NULL CHECK(entity_type IN ('preventive_plan', 'maintenance_order', 'maintenance_call', 'equipment')),
      entity_id INTEGER,
      is_active INTEGER DEFAULT 1,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS checklist_template_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      template_id INTEGER NOT NULL,
      order_index INTEGER NOT NULL DEFAULT 0,
      title TEXT NOT NULL,
      instructions TEXT,
      input_type TEXT NOT NULL DEFAULT 'boolean',
      required INTEGER DEFAULT 1,
      requires_photo INTEGER DEFAULT 0,
      requires_signature INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (template_id) REFERENCES checklist_templates(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS checklist_responses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      template_id INTEGER NOT NULL,
      item_id INTEGER NOT NULL,
      reference_type TEXT NOT NULL CHECK(reference_type IN ('maintenance_order', 'maintenance_call')),
      reference_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      value TEXT,
      notes TEXT,
      photo_path TEXT,
      signature_path TEXT,
      signature_data TEXT,
      responded_by INTEGER,
      responded_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (template_id) REFERENCES checklist_templates(id) ON DELETE CASCADE,
      FOREIGN KEY (item_id) REFERENCES checklist_template_items(id) ON DELETE CASCADE,
      FOREIGN KEY (responded_by) REFERENCES users(id)
    )
  `);

  // Adicionar colunas de assinatura se não existirem (migração)
  db.run(`ALTER TABLE checklist_responses ADD COLUMN signature_path TEXT`, () => {});
  db.run(`ALTER TABLE checklist_responses ADD COLUMN signature_data TEXT`, () => {});

  db.run('CREATE INDEX IF NOT EXISTS idx_checklist_template_items_template ON checklist_template_items(template_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_checklist_responses_reference ON checklist_responses(reference_type, reference_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_checklist_responses_item ON checklist_responses(item_id)');

  // Tabelas de Inventário
  db.run(`
    CREATE TABLE IF NOT EXISTS inventory_locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      address TEXT,
      is_active INTEGER DEFAULT 1,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS inventory_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT,
      unit TEXT DEFAULT 'un',
      min_quantity DECIMAL(10,2) DEFAULT 0,
      max_quantity DECIMAL(10,2),
      current_quantity DECIMAL(10,2) DEFAULT 0,
      unit_cost DECIMAL(10,2) DEFAULT 0,
      supplier TEXT,
      location_id INTEGER,
      is_active INTEGER DEFAULT 1,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (location_id) REFERENCES inventory_locations(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS inventory_movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id INTEGER NOT NULL,
      movement_type TEXT NOT NULL CHECK(movement_type IN ('entry', 'exit', 'adjustment', 'transfer')),
      quantity DECIMAL(10,2) NOT NULL,
      unit_cost DECIMAL(10,2),
      reference_type TEXT CHECK(reference_type IN ('maintenance_order', 'maintenance_call', 'purchase', 'adjustment', 'transfer')),
      reference_id INTEGER,
      location_id INTEGER,
      notes TEXT,
      created_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (item_id) REFERENCES inventory_items(id),
      FOREIGN KEY (location_id) REFERENCES inventory_locations(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  // Índices para inventário
  db.run('CREATE INDEX IF NOT EXISTS idx_inventory_items_code ON inventory_items(code)');
  db.run('CREATE INDEX IF NOT EXISTS idx_inventory_items_location ON inventory_items(location_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_inventory_movements_item ON inventory_movements(item_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_inventory_movements_reference ON inventory_movements(reference_type, reference_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_inventory_movements_created ON inventory_movements(created_at)');

  console.log('✅ Tabelas do banco de dados inicializadas');
}

// Função helper para queries
function query(sql, params = []) {
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

function run(sql, params = []) {
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

function get(sql, params = []) {
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

module.exports = {
  db,
  query,
  run,
  get,
};


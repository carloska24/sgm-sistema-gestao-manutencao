const express = require('express');
const router = express.Router();
const { z } = require('zod');
const { authenticate, authorize } = require('../middleware/auth');
const { query, get, run } = require('../database');

// Schemas de validação
const locationSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  is_active: z.boolean().optional().default(true),
});

const itemSchema = z.object({
  code: z.string().min(1, 'Código é obrigatório'),
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  unit: z.string().default('un'),
  min_quantity: z.number().min(0).default(0),
  max_quantity: z.number().optional().nullable(),
  current_quantity: z.number().min(0).default(0),
  unit_cost: z.number().min(0).default(0),
  supplier: z.string().optional().nullable(),
  location_id: z.number().int().optional().nullable(),
  is_active: z.boolean().optional().default(true),
});

const movementSchema = z.object({
  item_id: z.number().int().positive('Item é obrigatório'),
  movement_type: z.enum(['entry', 'exit', 'adjustment', 'transfer']),
  quantity: z.number().positive('Quantidade deve ser positiva'),
  unit_cost: z.number().min(0).optional().nullable(),
  reference_type: z.enum(['maintenance_order', 'maintenance_call', 'purchase', 'adjustment', 'transfer']).optional().nullable(),
  reference_id: z.number().int().optional().nullable(),
  location_id: z.number().int().optional().nullable(),
  notes: z.string().optional().nullable(),
});

// ========== LOCAÇÕES ==========

// Listar locações
router.get('/locations', authenticate, async (req, res, next) => {
  try {
    const { is_active } = req.query;
    let sql = 'SELECT * FROM inventory_locations';
    const params = [];

    if (is_active === 'true') {
      sql += ' WHERE is_active = 1';
    } else if (is_active === 'false') {
      sql += ' WHERE is_active = 0';
    }

    sql += ' ORDER BY name ASC';

    const locations = await query(sql, params);
    res.json({ success: true, data: locations });
  } catch (error) {
    next(error);
  }
});

// Criar locação
router.post('/locations', authenticate, authorize('admin', 'manager'), async (req, res, next) => {
  try {
    const data = locationSchema.parse(req.body);
    const result = await run(
      `INSERT INTO inventory_locations (name, description, address, is_active, created_by)
       VALUES (?, ?, ?, ?, ?)`,
      [data.name, data.description || null, data.address || null, data.is_active ? 1 : 0, req.user.id]
    );

    const location = await get('SELECT * FROM inventory_locations WHERE id = ?', [result.lastID]);
    res.status(201).json({ success: true, data: location });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Dados inválidos', details: error.errors });
    }
    next(error);
  }
});

// Atualizar locação
router.put('/locations/:id', authenticate, authorize('admin', 'manager'), async (req, res, next) => {
  try {
    const data = locationSchema.partial().parse(req.body);
    const updates = [];
    const params = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      params.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push('description = ?');
      params.push(data.description);
    }
    if (data.address !== undefined) {
      updates.push('address = ?');
      params.push(data.address);
    }
    if (data.is_active !== undefined) {
      updates.push('is_active = ?');
      params.push(data.is_active ? 1 : 0);
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: 'Nenhum campo para atualizar' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(req.params.id);

    const result = await run(
      `UPDATE inventory_locations SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Locação não encontrada' });
    }

    const location = await get('SELECT * FROM inventory_locations WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: location });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Dados inválidos', details: error.errors });
    }
    next(error);
  }
});

// Deletar locação
router.delete('/locations/:id', authenticate, authorize('admin', 'manager'), async (req, res, next) => {
  try {
    // Verificar se há itens usando esta locação
    const items = await query('SELECT COUNT(*) as count FROM inventory_items WHERE location_id = ?', [req.params.id]);
    if (items[0].count > 0) {
      return res.status(400).json({
        success: false,
        error: 'Não é possível deletar locação com itens associados',
      });
    }

    const result = await run('DELETE FROM inventory_locations WHERE id = ?', [req.params.id]);
    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Locação não encontrada' });
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// ========== ITENS ==========

// Listar itens
router.get('/items', authenticate, async (req, res, next) => {
  try {
    const { search, category, location_id, is_active, low_stock } = req.query;
    let sql = `
      SELECT i.*, l.name as location_name
      FROM inventory_items i
      LEFT JOIN inventory_locations l ON l.id = i.location_id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      sql += ' AND (i.name LIKE ? OR i.code LIKE ? OR i.description LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (category) {
      sql += ' AND i.category = ?';
      params.push(category);
    }

    if (location_id) {
      sql += ' AND i.location_id = ?';
      params.push(location_id);
    }

    if (is_active === 'true') {
      sql += ' AND i.is_active = 1';
    } else if (is_active === 'false') {
      sql += ' AND i.is_active = 0';
    }

    if (low_stock === 'true') {
      sql += ' AND i.current_quantity <= i.min_quantity';
    }

    sql += ' ORDER BY i.name ASC';

    const items = await query(sql, params);
    res.json({ success: true, data: items });
  } catch (error) {
    next(error);
  }
});

// Obter item específico
router.get('/items/:id', authenticate, async (req, res, next) => {
  try {
    const item = await get(
      `SELECT i.*, l.name as location_name
       FROM inventory_items i
       LEFT JOIN inventory_locations l ON l.id = i.location_id
       WHERE i.id = ?`,
      [req.params.id]
    );

    if (!item) {
      return res.status(404).json({ success: false, error: 'Item não encontrado' });
    }

    res.json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
});

// Criar item
router.post('/items', authenticate, authorize('admin', 'manager'), async (req, res, next) => {
  try {
    const data = itemSchema.parse(req.body);
    const result = await run(
      `INSERT INTO inventory_items 
       (code, name, description, category, unit, min_quantity, max_quantity, current_quantity, unit_cost, supplier, location_id, is_active, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.code,
        data.name,
        data.description || null,
        data.category || null,
        data.unit || 'un',
        data.min_quantity || 0,
        data.max_quantity || null,
        data.current_quantity || 0,
        data.unit_cost || 0,
        data.supplier || null,
        data.location_id || null,
        data.is_active ? 1 : 0,
        req.user.id,
      ]
    );

    const item = await get(
      `SELECT i.*, l.name as location_name
       FROM inventory_items i
       LEFT JOIN inventory_locations l ON l.id = i.location_id
       WHERE i.id = ?`,
      [result.lastID]
    );

    res.status(201).json({ success: true, data: item });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Dados inválidos', details: error.errors });
    }
    next(error);
  }
});

// Atualizar item
router.put('/items/:id', authenticate, authorize('admin', 'manager'), async (req, res, next) => {
  try {
    const data = itemSchema.partial().parse(req.body);
    const updates = [];
    const params = [];

    if (data.code !== undefined) {
      updates.push('code = ?');
      params.push(data.code);
    }
    if (data.name !== undefined) {
      updates.push('name = ?');
      params.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push('description = ?');
      params.push(data.description);
    }
    if (data.category !== undefined) {
      updates.push('category = ?');
      params.push(data.category);
    }
    if (data.unit !== undefined) {
      updates.push('unit = ?');
      params.push(data.unit);
    }
    if (data.min_quantity !== undefined) {
      updates.push('min_quantity = ?');
      params.push(data.min_quantity);
    }
    if (data.max_quantity !== undefined) {
      updates.push('max_quantity = ?');
      params.push(data.max_quantity);
    }
    if (data.current_quantity !== undefined) {
      updates.push('current_quantity = ?');
      params.push(data.current_quantity);
    }
    if (data.unit_cost !== undefined) {
      updates.push('unit_cost = ?');
      params.push(data.unit_cost);
    }
    if (data.supplier !== undefined) {
      updates.push('supplier = ?');
      params.push(data.supplier);
    }
    if (data.location_id !== undefined) {
      updates.push('location_id = ?');
      params.push(data.location_id);
    }
    if (data.is_active !== undefined) {
      updates.push('is_active = ?');
      params.push(data.is_active ? 1 : 0);
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: 'Nenhum campo para atualizar' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(req.params.id);

    const result = await run(
      `UPDATE inventory_items SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Item não encontrado' });
    }

    const item = await get(
      `SELECT i.*, l.name as location_name
       FROM inventory_items i
       LEFT JOIN inventory_locations l ON l.id = i.location_id
       WHERE i.id = ?`,
      [req.params.id]
    );

    res.json({ success: true, data: item });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Dados inválidos', details: error.errors });
    }
    next(error);
  }
});

// Deletar item
router.delete('/items/:id', authenticate, authorize('admin', 'manager'), async (req, res, next) => {
  try {
    // Verificar se há movimentações
    const movements = await query('SELECT COUNT(*) as count FROM inventory_movements WHERE item_id = ?', [req.params.id]);
    if (movements[0].count > 0) {
      return res.status(400).json({
        success: false,
        error: 'Não é possível deletar item com histórico de movimentações',
      });
    }

    const result = await run('DELETE FROM inventory_items WHERE id = ?', [req.params.id]);
    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Item não encontrado' });
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// ========== MOVIMENTAÇÕES ==========

// Listar movimentações
router.get('/movements', authenticate, async (req, res, next) => {
  try {
    const { item_id, reference_type, reference_id, movement_type, start_date, end_date } = req.query;
    let sql = `
      SELECT m.*, i.name as item_name, i.code as item_code, l.name as location_name,
             u.username as created_by_username, u.full_name as created_by_name
      FROM inventory_movements m
      INNER JOIN inventory_items i ON i.id = m.item_id
      LEFT JOIN inventory_locations l ON l.id = m.location_id
      LEFT JOIN users u ON u.id = m.created_by
      WHERE 1=1
    `;
    const params = [];

    if (item_id) {
      sql += ' AND m.item_id = ?';
      params.push(item_id);
    }

    if (reference_type) {
      sql += ' AND m.reference_type = ?';
      params.push(reference_type);
    }

    if (reference_id) {
      sql += ' AND m.reference_id = ?';
      params.push(reference_id);
    }

    if (movement_type) {
      sql += ' AND m.movement_type = ?';
      params.push(movement_type);
    }

    if (start_date) {
      sql += ' AND DATE(m.created_at) >= ?';
      params.push(start_date);
    }

    if (end_date) {
      sql += ' AND DATE(m.created_at) <= ?';
      params.push(end_date);
    }

    sql += ' ORDER BY m.created_at DESC';

    const movements = await query(sql, params);
    res.json({ success: true, data: movements });
  } catch (error) {
    next(error);
  }
});

// Criar movimentação
router.post('/movements', authenticate, authorize('admin', 'manager', 'technician'), async (req, res, next) => {
  try {
    const data = movementSchema.parse(req.body);

    await run('BEGIN TRANSACTION');
    try {
      // Verificar se item existe
      const item = await get('SELECT * FROM inventory_items WHERE id = ?', [data.item_id]);
      if (!item) {
        throw new Error('Item não encontrado');
      }

      // Atualizar quantidade do item baseado no tipo de movimentação
      let newQuantity = item.current_quantity;
      if (data.movement_type === 'entry') {
        newQuantity += data.quantity;
      } else if (data.movement_type === 'exit') {
        newQuantity -= data.quantity;
        if (newQuantity < 0) {
          throw new Error('Quantidade insuficiente em estoque');
        }
      } else if (data.movement_type === 'adjustment') {
        newQuantity = data.quantity;
      }
      // transfer não altera quantidade total, apenas move entre locações

      // Criar movimentação
      const result = await run(
        `INSERT INTO inventory_movements 
         (item_id, movement_type, quantity, unit_cost, reference_type, reference_id, location_id, notes, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.item_id,
          data.movement_type,
          data.quantity,
          data.unit_cost || null,
          data.reference_type || null,
          data.reference_id || null,
          data.location_id || null,
          data.notes || null,
          req.user.id,
        ]
      );

      // Atualizar quantidade do item (exceto transfer)
      if (data.movement_type !== 'transfer') {
        await run('UPDATE inventory_items SET current_quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [
          newQuantity,
          data.item_id,
        ]);
      }

      await run('COMMIT');

      const movement = await get(
        `SELECT m.*, i.name as item_name, i.code as item_code, l.name as location_name,
                u.username as created_by_username, u.full_name as created_by_name
         FROM inventory_movements m
         INNER JOIN inventory_items i ON i.id = m.item_id
         LEFT JOIN inventory_locations l ON l.id = m.location_id
         LEFT JOIN users u ON u.id = m.created_by
         WHERE m.id = ?`,
        [result.lastID]
      );

      res.status(201).json({ success: true, data: movement });
    } catch (error) {
      await run('ROLLBACK');
      throw error;
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Dados inválidos', details: error.errors });
    }
    next(error);
  }
});

// Obter histórico de movimentações de um item
router.get('/items/:id/movements', authenticate, async (req, res, next) => {
  try {
    const movements = await query(
      `SELECT m.*, l.name as location_name,
              u.username as created_by_username, u.full_name as created_by_name
       FROM inventory_movements m
       LEFT JOIN inventory_locations l ON l.id = m.location_id
       LEFT JOIN users u ON u.id = m.created_by
       WHERE m.item_id = ?
       ORDER BY m.created_at DESC`,
      [req.params.id]
    );

    res.json({ success: true, data: movements });
  } catch (error) {
    next(error);
  }
});

// Obter estatísticas de inventário
router.get('/stats', authenticate, async (req, res, next) => {
  try {
    const [totalItems, activeItems, lowStockItems, totalValue] = await Promise.all([
      query('SELECT COUNT(*) as count FROM inventory_items'),
      query('SELECT COUNT(*) as count FROM inventory_items WHERE is_active = 1'),
      query('SELECT COUNT(*) as count FROM inventory_items WHERE current_quantity <= min_quantity AND is_active = 1'),
      query('SELECT SUM(current_quantity * unit_cost) as total FROM inventory_items WHERE is_active = 1'),
    ]);

    res.json({
      success: true,
      data: {
        total_items: totalItems[0].count,
        active_items: activeItems[0].count,
        low_stock_items: lowStockItems[0].count,
        total_value: totalValue[0].total || 0,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;


const express = require('express');
const router = express.Router();
const { z } = require('zod');
const { query, run, get } = require('../database');
const { authenticate, authorize } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuração de upload de arquivos
const uploadDir = path.join(__dirname, '../uploads/equipment');
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

// Schema de validação
const equipmentSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  code: z.string().min(1, 'Código é obrigatório'),
  description: z.string().optional(),
  model: z.string().optional(),
  manufacturer: z.string().optional(),
  serial_number: z.string().optional(),
  acquisition_date: z.string().optional(),
  acquisition_cost: z.number().optional(),
  location: z.string().optional(),
  status: z.enum(['active', 'inactive', 'maintenance', 'deactivated']).default('active'),
  criticality: z.enum(['low', 'medium', 'high']).default('medium'),
  power: z.string().optional(),
  capacity: z.string().optional(),
  voltage: z.string().optional(),
  fuel_type: z.string().optional(),
  dimensions: z.string().optional(),
});

// Listar todos os equipamentos com filtros e paginação
router.get('/', authenticate, authorize('admin', 'manager', 'technician'), async (req, res, next) => {
  try {
    const {
      search,
      status,
      criticality,
      manufacturer,
      location,
      include_demo,
      page = 1,
      limit = 20,
    } = req.query;

    // Verificar se há equipamentos reais (sem demo)
    const realEquipmentCount = await get('SELECT COUNT(*) as count FROM equipment WHERE (is_demo = 0 OR is_demo IS NULL)');
    const hasRealEquipment = realEquipmentCount?.count > 0;

    // Se não há equipamentos reais E include_demo não foi especificado, mostrar demo também
    // Se include_demo=true, sempre mostrar demo
    const shouldIncludeDemo = include_demo === 'true' || (!hasRealEquipment && include_demo !== 'false');

    let sql = shouldIncludeDemo 
      ? 'SELECT * FROM equipment WHERE 1=1' 
      : 'SELECT * FROM equipment WHERE (is_demo = 0 OR is_demo IS NULL)';
    const params = [];

    if (search) {
      sql += ' AND (name LIKE ? OR code LIKE ? OR description LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }

    if (criticality) {
      sql += ' AND criticality = ?';
      params.push(criticality);
    }

    if (manufacturer) {
      sql += ' AND manufacturer LIKE ?';
      params.push(`%${manufacturer}%`);
    }

    if (location) {
      sql += ' AND location LIKE ?';
      params.push(`%${location}%`);
    }

    sql += ' ORDER BY name LIMIT ? OFFSET ?';
    const offset = (parseInt(page) - 1) * parseInt(limit);
    params.push(parseInt(limit), offset);

    const equipment = await query(sql, params);

    // Contar total para paginação
    let countSql = shouldIncludeDemo 
      ? 'SELECT COUNT(*) as count FROM equipment WHERE 1=1' 
      : 'SELECT COUNT(*) as count FROM equipment WHERE (is_demo = 0 OR is_demo IS NULL)';
    const countParams = [];
    
    if (search) {
      countSql += ' AND (name LIKE ? OR code LIKE ? OR description LIKE ?)';
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
    }
    if (status) {
      countSql += ' AND status = ?';
      countParams.push(status);
    }
    if (criticality) {
      countSql += ' AND criticality = ?';
      countParams.push(criticality);
    }
    if (manufacturer) {
      countSql += ' AND manufacturer LIKE ?';
      countParams.push(`%${manufacturer}%`);
    }
    if (location) {
      countSql += ' AND location LIKE ?';
      countParams.push(`%${location}%`);
    }

    const countResult = await get(countSql, countParams);

    res.json({
      success: true,
      data: equipment,
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

// Obter equipamento específico com histórico
router.get('/:id', authenticate, authorize('admin', 'manager', 'technician'), async (req, res, next) => {
  try {
    const equipment = await get('SELECT * FROM equipment WHERE id = ?', [req.params.id]);

    if (!equipment) {
      return res.status(404).json({
        success: false,
        error: 'Equipamento não encontrado',
      });
    }

    // Buscar histórico de manutenções preventivas
    const maintenanceOrders = await query(
      `SELECT 
        mo.id,
        mo.plan_id,
        mo.equipment_id,
        mo.type,
        mo.description,
        mo.status,
        mo.scheduled_date,
        mo.completed_date,
        mo.started_at,
        mo.execution_time,
        mo.created_at,
        mo.created_by,
        'preventive' as maintenance_type,
        u.username as performed_by_name
       FROM maintenance_orders mo
       LEFT JOIN users u ON mo.created_by = u.id
       WHERE mo.equipment_id = ?
       ORDER BY mo.created_at DESC
       LIMIT 20`,
      [req.params.id]
    );

    // Buscar histórico de chamados corretivos
    const maintenanceCalls = await query(
      `SELECT 
        mc.id,
        mc.equipment_id,
        mc.type,
        mc.description,
        mc.status,
        mc.occurrence_date as scheduled_date,
        mc.completed_at as completed_date,
        mc.started_at,
        mc.execution_time,
        mc.created_at,
        mc.created_by,
        'corrective' as maintenance_type,
        u.username as performed_by_name
       FROM maintenance_calls mc
       LEFT JOIN users u ON mc.created_by = u.id
       WHERE mc.equipment_id = ?
       ORDER BY mc.created_at DESC
       LIMIT 20`,
      [req.params.id]
    );

    // Combinar e ordenar por data
    const maintenanceHistory = [...maintenanceOrders, ...maintenanceCalls]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 20);

    // Buscar documentos
    const documents = await query(
      `SELECT d.*, u.username as uploaded_by_name
       FROM equipment_documents d
       LEFT JOIN users u ON d.uploaded_by = u.id
       WHERE d.equipment_id = ?
       ORDER BY d.created_at DESC`,
      [req.params.id]
    );

    res.json({
      success: true,
      data: {
        ...equipment,
        maintenanceHistory,
        documents,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Criar novo equipamento
router.post('/', authenticate, authorize('admin', 'manager'), async (req, res, next) => {
  try {
    const data = equipmentSchema.parse(req.body);

    // Verificar se código já existe
    const existing = await get('SELECT id FROM equipment WHERE code = ?', [data.code]);

    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'Código de equipamento já existe',
      });
    }

    const result = await run(
      `INSERT INTO equipment 
      (name, code, description, model, manufacturer, serial_number, 
       acquisition_date, acquisition_cost, location, status, criticality,
       power, capacity, voltage, fuel_type, dimensions)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.name,
        data.code,
        data.description || null,
        data.model || null,
        data.manufacturer || null,
        data.serial_number || null,
        data.acquisition_date || null,
        data.acquisition_cost || null,
        data.location || null,
        data.status,
        data.criticality,
        data.power || null,
        data.capacity || null,
        data.voltage || null,
        data.fuel_type || null,
        data.dimensions || null,
      ]
    );

    const newEquipment = await get('SELECT * FROM equipment WHERE id = ?', [result.lastID]);

    res.status(201).json({
      success: true,
      message: 'Equipamento criado com sucesso',
      data: newEquipment,
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

// Atualizar equipamento
router.put('/:id', authenticate, authorize('admin', 'manager'), async (req, res, next) => {
  try {
    const data = equipmentSchema.partial().parse(req.body);

    const equipment = await get('SELECT id FROM equipment WHERE id = ?', [req.params.id]);

    if (!equipment) {
      return res.status(404).json({
        success: false,
        error: 'Equipamento não encontrado',
      });
    }

    // Verificar se código já existe (se estiver sendo alterado)
    if (data.code) {
      const existing = await get(
        'SELECT id FROM equipment WHERE code = ? AND id != ?',
        [data.code, req.params.id]
      );

      if (existing) {
        return res.status(400).json({
          success: false,
          error: 'Código de equipamento já existe',
        });
      }
    }

    const updates = [];
    const values = [];

    Object.keys(data).forEach((key) => {
      if (data[key] !== undefined) {
        updates.push(`${key} = ?`);
        values.push(data[key]);
      }
    });

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(req.params.id);

    await run(
      `UPDATE equipment SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    const updatedEquipment = await get('SELECT * FROM equipment WHERE id = ?', [req.params.id]);

    res.json({
      success: true,
      message: 'Equipamento atualizado com sucesso',
      data: updatedEquipment,
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

// Deletar equipamento
router.delete('/:id', authenticate, authorize('admin', 'manager'), async (req, res, next) => {
  try {
    const result = await run('DELETE FROM equipment WHERE id = ?', [req.params.id]);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'Equipamento não encontrado',
      });
    }

    res.json({
      success: true,
      message: 'Equipamento deletado com sucesso',
    });
  } catch (error) {
    next(error);
  }
});

// Upload de documentos
router.post('/:id/documents', authenticate, authorize('admin', 'manager'), upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Arquivo não fornecido',
      });
    }

    const equipment = await get('SELECT id FROM equipment WHERE id = ?', [req.params.id]);

    if (!equipment) {
      // Deletar arquivo se equipamento não existe
      fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        error: 'Equipamento não encontrado',
      });
    }

    const result = await run(
      `INSERT INTO equipment_documents 
      (equipment_id, file_name, file_path, file_type, file_size, document_type, uploaded_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        req.params.id,
        req.file.originalname,
        req.file.path,
        req.file.mimetype,
        req.file.size,
        req.body.document_type || 'other',
        req.user.id,
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Documento enviado com sucesso',
      data: {
        id: result.lastID,
        file_name: req.file.originalname,
      },
    });
  } catch (error) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
});

// Listar documentos de um equipamento
router.get('/:id/documents', authenticate, authorize('admin', 'manager', 'technician'), async (req, res, next) => {
  try {
    const documents = await query(
      `SELECT d.*, u.username as uploaded_by_name
       FROM equipment_documents d
       LEFT JOIN users u ON d.uploaded_by = u.id
       WHERE d.equipment_id = ?
       ORDER BY d.created_at DESC`,
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
      'SELECT file_path, file_name FROM equipment_documents WHERE id = ? AND equipment_id = ?',
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
router.delete('/:id/documents/:docId', authenticate, authorize('admin', 'manager'), async (req, res, next) => {
  try {
    const document = await get(
      'SELECT file_path FROM equipment_documents WHERE id = ? AND equipment_id = ?',
      [req.params.docId, req.params.id]
    );

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Documento não encontrado',
      });
    }

    // Deletar arquivo
    if (fs.existsSync(document.file_path)) {
      fs.unlinkSync(document.file_path);
    }

    await run('DELETE FROM equipment_documents WHERE id = ?', [req.params.docId]);

    res.json({
      success: true,
      message: 'Documento deletado com sucesso',
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

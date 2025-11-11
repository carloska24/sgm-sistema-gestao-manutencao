const express = require('express');
const router = express.Router();
const { z } = require('zod');
const { authenticate, authorize } = require('../middleware/auth');
const { query, get, run } = require('../database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const entityTypes = ['preventive_plan', 'maintenance_order', 'maintenance_call', 'equipment'];
const inputTypes = ['boolean', 'number', 'text', 'multi'];
const responseStatuses = ['pending', 'completed', 'skipped', 'failed'];

// Configuração de upload de fotos para checklists
const uploadDir = path.join(__dirname, '../uploads/checklists');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `checklist-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Apenas imagens são permitidas (JPEG, PNG, GIF, WEBP)'));
  },
});

const templateSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional().nullable(),
  entity_type: z.enum(
    entityTypes.map(e => e),
    { errorMap: () => ({ message: 'Tipo de entidade inválido' }) }
  ),
  entity_id: z.number().int().optional().nullable(),
  is_active: z.boolean().optional(),
  items: z
    .array(
      z.object({
        id: z.number().int().optional(),
        order_index: z.number().int().min(0).optional().default(0),
        title: z.string().min(1, 'Título é obrigatório'),
        instructions: z.string().optional().nullable(),
        input_type: z
          .enum(inputTypes.map(v => v))
          .optional()
          .default('boolean'),
        required: z.boolean().optional().default(true),
        requires_photo: z.boolean().optional().default(false),
        requires_signature: z.boolean().optional().default(false),
      })
    )
    .optional()
    .default([]),
});

const responseSchema = z.object({
  template_id: z.number().int(),
  reference_type: z.enum(['maintenance_order', 'maintenance_call']),
  reference_id: z.number().int(),
  items: z
    .array(
      z.object({
        item_id: z.number().int(),
        status: z.enum(responseStatuses).optional().default('completed'),
        value: z.string().optional().nullable(),
        notes: z.string().optional().nullable(),
        photo_path: z.string().optional().nullable(),
        signature_path: z.string().optional().nullable(),
        signature_data: z.string().optional().nullable(),
      })
    )
    .min(1, 'Informe pelo menos um item'),
});

function mapTemplateRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    entity_type: row.entity_type,
    entity_id: row.entity_id,
    is_active: row.is_active === 1,
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function mapItemRow(row) {
  return {
    id: row.id,
    template_id: row.template_id,
    order_index: row.order_index,
    title: row.title,
    instructions: row.instructions,
    input_type: row.input_type,
    required: row.required === 1,
    requires_photo: row.requires_photo === 1,
    requires_signature: row.requires_signature === 1,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

const GEMINI_MODEL_CANDIDATES = [
  'gemini-1.5-flash-latest',
  'gemini-1.5-flash',
  'gemini-1.5-pro-latest',
  'gemini-1.5-pro',
  'gemini-1.0-pro-latest',
  'gemini-1.0-pro',
];

async function generateContentWithGemini(apiKey, model, promptText, { generationConfig } = {}) {
  const endpoint = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`;

  const body = {
    contents: [
      {
        role: 'user',
        parts: [{ text: promptText }],
      },
    ],
    generationConfig: {
      temperature: 0.4,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 2048,
      ...generationConfig,
    },
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const raw = await response.text();

  if (!response.ok) {
    let errorPayload;
    try {
      errorPayload = raw ? JSON.parse(raw) : undefined;
    } catch (parseError) {
      errorPayload = undefined;
    }

    const apiMessage =
      errorPayload?.error?.message ||
      (response.status === 404
        ? 'Modelo não disponível para esta conta/projeto.'
        : `${response.status} ${response.statusText}`);

    const err = new Error(`[Gemini API Error] ${apiMessage}`);
    err.status = response.status;
    err.payload = errorPayload;
    err.raw = raw;
    throw err;
  }

  let data = {};
  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch (parseError) {
      const err = new Error('Erro ao interpretar a resposta do Gemini');
      err.cause = parseError;
      err.raw = raw;
      throw err;
    }
  }

  const generatedText = (data.candidates || [])
    .flatMap((candidate) => candidate?.content?.parts?.map((part) => part.text || '') || [])
    .join('')
    .trim();

  return { generatedText, data };
}

router.get('/', authenticate, async (req, res, next) => {
  try {
    const { entity_type, entity_id, is_active = 'true' } = req.query;

    const filters = [];
    const params = [];

    if (entity_type && entityTypes.includes(entity_type)) {
      filters.push('entity_type = ?');
      params.push(entity_type);
    }

    if (entity_id) {
      filters.push('entity_id = ?');
      params.push(entity_id);
    }

    if (is_active === 'true') {
      filters.push('is_active = 1');
    } else if (is_active === 'false') {
      filters.push('is_active = 0');
    }

    let sql = 'SELECT * FROM checklist_templates';
    if (filters.length > 0) {
      sql += ` WHERE ${filters.join(' AND ')}`;
    }
    sql += ' ORDER BY created_at DESC';

    const rows = await query(sql, params);

    // Otimização: Buscar todos os itens de uma vez usando IN clause
    const templateIds = rows.map(row => row.id);
    let itemsByTemplate = {};
    
    if (templateIds.length > 0) {
      const placeholders = templateIds.map(() => '?').join(',');
      const itemsSql = `SELECT * FROM checklist_template_items WHERE template_id IN (${placeholders}) ORDER BY template_id, order_index ASC, id ASC`;
      const allItems = await query(itemsSql, templateIds);
      
      // Agrupar itens por template_id
      itemsByTemplate = allItems.reduce((acc, item) => {
        const templateId = item.template_id;
        if (!acc[templateId]) {
          acc[templateId] = [];
        }
        acc[templateId].push(mapItemRow(item));
        return acc;
      }, {});
    }

    // Combinar templates com seus itens
    const templatesWithItems = rows.map(row => {
      const template = mapTemplateRow(row);
      return {
        ...template,
        items: itemsByTemplate[template.id] || [],
      };
    });

    res.json({
      success: true,
      data: templatesWithItems,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const template = await get('SELECT * FROM checklist_templates WHERE id = ?', [req.params.id]);

    if (!template) {
      return res.status(404).json({ success: false, error: 'Checklist não encontrado' });
    }

    const items = await query(
      'SELECT * FROM checklist_template_items WHERE template_id = ? ORDER BY order_index ASC, id ASC',
      [req.params.id]
    );

    res.json({
      success: true,
      data: {
        ...mapTemplateRow(template),
        items: items.map(mapItemRow),
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticate, authorize('admin', 'manager'), async (req, res, next) => {
  try {
    const data = templateSchema.parse(req.body);

    await run('BEGIN TRANSACTION');
    try {
      const templateResult = await run(
        `INSERT INTO checklist_templates (name, description, entity_type, entity_id, is_active, created_by)
         VALUES (?, ?, ?, ?, ?, ?)`.replace(/\s+/g, ' '),
        [
          data.name,
          data.description || null,
          data.entity_type,
          data.entity_id || null,
          data.is_active === false ? 0 : 1,
          req.user.id,
        ]
      );

      const templateId = templateResult.lastID;

      for (const item of data.items) {
        await run(
          `INSERT INTO checklist_template_items
           (template_id, order_index, title, instructions, input_type, required, requires_photo, requires_signature)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`.replace(/\s+/g, ' '),
          [
            templateId,
            item.order_index ?? 0,
            item.title,
            item.instructions || null,
            item.input_type || 'boolean',
            item.required === false ? 0 : 1,
            item.requires_photo ? 1 : 0,
            item.requires_signature ? 1 : 0,
          ]
        );
      }

      await run('COMMIT');

      const template = await get('SELECT * FROM checklist_templates WHERE id = ?', [templateId]);
      const items = await query(
        'SELECT * FROM checklist_template_items WHERE template_id = ? ORDER BY order_index ASC, id ASC',
        [templateId]
      );

      res.status(201).json({
        success: true,
        data: {
          ...mapTemplateRow(template),
          items: items.map(mapItemRow),
        },
      });
    } catch (error) {
      await run('ROLLBACK');
      throw error;
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ success: false, error: 'Dados inválidos', details: error.errors });
    }
    next(error);
  }
});

router.put('/:id', authenticate, authorize('admin', 'manager'), async (req, res, next) => {
  try {
    const data = templateSchema.partial().parse(req.body);

    const existing = await get('SELECT * FROM checklist_templates WHERE id = ?', [req.params.id]);

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Checklist não encontrado' });
    }

    await run('BEGIN TRANSACTION');
    try {
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
      if (data.entity_type !== undefined) {
        updates.push('entity_type = ?');
        params.push(data.entity_type);
      }
      if (data.entity_id !== undefined) {
        updates.push('entity_id = ?');
        params.push(data.entity_id);
      }
      if (data.is_active !== undefined) {
        updates.push('is_active = ?');
        params.push(data.is_active ? 1 : 0);
      }

      if (updates.length > 0) {
        updates.push('updated_at = CURRENT_TIMESTAMP');
        await run(`UPDATE checklist_templates SET ${updates.join(', ')} WHERE id = ?`, [
          ...params,
          req.params.id,
        ]);
      }

      if (Array.isArray(data.items)) {
        await run('DELETE FROM checklist_template_items WHERE template_id = ?', [req.params.id]);

        for (const item of data.items) {
          await run(
            `INSERT INTO checklist_template_items
             (template_id, order_index, title, instructions, input_type, required, requires_photo, requires_signature)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`.replace(/\s+/g, ' '),
            [
              req.params.id,
              item.order_index ?? 0,
              item.title,
              item.instructions || null,
              item.input_type || 'boolean',
              item.required === false ? 0 : 1,
              item.requires_photo ? 1 : 0,
              item.requires_signature ? 1 : 0,
            ]
          );
        }
      }

      await run('COMMIT');

      const template = await get('SELECT * FROM checklist_templates WHERE id = ?', [req.params.id]);
      const items = await query(
        'SELECT * FROM checklist_template_items WHERE template_id = ? ORDER BY order_index ASC, id ASC',
        [req.params.id]
      );

      res.json({
        success: true,
        data: {
          ...mapTemplateRow(template),
          items: items.map(mapItemRow),
        },
      });
    } catch (error) {
      await run('ROLLBACK');
      throw error;
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ success: false, error: 'Dados inválidos', details: error.errors });
    }
    next(error);
  }
});

router.patch('/:id/status', authenticate, authorize('admin', 'manager'), async (req, res, next) => {
  try {
    const bodySchema = z.object({ is_active: z.boolean() });
    const data = bodySchema.parse(req.body);

    const result = await run(
      'UPDATE checklist_templates SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [data.is_active ? 1 : 0, req.params.id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Checklist não encontrado' });
    }

    res.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ success: false, error: 'Dados inválidos', details: error.errors });
    }
    next(error);
  }
});

router.delete('/:id', authenticate, authorize('admin', 'manager'), async (req, res, next) => {
  try {
    const result = await run('DELETE FROM checklist_templates WHERE id = ?', [req.params.id]);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Checklist não encontrado' });
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/responses', authenticate, async (req, res, next) => {
  try {
    const { reference_type, reference_id } = req.query;

    if (!reference_type || !['maintenance_order', 'maintenance_call'].includes(reference_type)) {
      return res.status(400).json({ success: false, error: 'reference_type inválido' });
    }

    if (!reference_id) {
      return res.status(400).json({ success: false, error: 'reference_id é obrigatório' });
    }

    const template = await get('SELECT * FROM checklist_templates WHERE id = ?', [req.params.id]);

    if (!template) {
      return res.status(404).json({ success: false, error: 'Checklist não encontrado' });
    }

    const items = await query(
      `SELECT cr.*, cti.title, cti.instructions, cti.input_type
       FROM checklist_responses cr
       INNER JOIN checklist_template_items cti ON cti.id = cr.item_id
       WHERE cr.template_id = ? AND cr.reference_type = ? AND cr.reference_id = ?
       ORDER BY cti.order_index ASC, cr.item_id ASC`,
      [req.params.id, reference_type, reference_id]
    );

    res.json({
      success: true,
      data: items.map(row => ({
        id: row.id,
        template_id: row.template_id,
        item_id: row.item_id,
        title: row.title,
        instructions: row.instructions,
        input_type: row.input_type,
        reference_type: row.reference_type,
        reference_id: row.reference_id,
        status: row.status,
        value: row.value,
        notes: row.notes,
        photo_path: row.photo_path,
        signature_path: row.signature_path,
        signature_data: row.signature_data,
        responded_by: row.responded_by,
        responded_at: row.responded_at,
        created_at: row.created_at,
        updated_at: row.updated_at,
      })),
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/responses', authenticate, async (req, res, next) => {
  try {
    const data = responseSchema.parse({ ...req.body, template_id: Number(req.params.id) });

    const template = await get('SELECT * FROM checklist_templates WHERE id = ?', [
      data.template_id,
    ]);

    if (!template) {
      return res.status(404).json({ success: false, error: 'Checklist não encontrado' });
    }

    await run('BEGIN TRANSACTION');
    try {
      await run(
        'DELETE FROM checklist_responses WHERE template_id = ? AND reference_type = ? AND reference_id = ?',
        [data.template_id, data.reference_type, data.reference_id]
      );

      const timestamp = new Date().toISOString();

      for (const item of data.items) {
        await run(
          `INSERT INTO checklist_responses
           (template_id, item_id, reference_type, reference_id, status, value, notes, photo_path, signature_path, signature_data, responded_by, responded_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`.replace(/\s+/g, ' '),
          [
            data.template_id,
            item.item_id,
            data.reference_type,
            data.reference_id,
            item.status || 'completed',
            item.value || null,
            item.notes || null,
            item.photo_path || null,
            item.signature_path || null,
            item.signature_data || null,
            req.user.id,
            item.status && item.status !== 'pending' ? timestamp : null,
          ]
        );
      }

      await run('COMMIT');

      res.status(201).json({ success: true });
    } catch (error) {
      await run('ROLLBACK');
      throw error;
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ success: false, error: 'Dados inválidos', details: error.errors });
    }
    next(error);
  }
});

// Upload de foto para item de checklist
router.post(
  '/:id/responses/:itemId/photo',
  authenticate,
  upload.single('photo'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'Arquivo não fornecido',
        });
      }

      const templateId = Number(req.params.id);
      const itemId = Number(req.params.itemId);
      const { reference_type, reference_id } = req.body;

      if (!reference_type || !reference_id) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({
          success: false,
          error: 'reference_type e reference_id são obrigatórios',
        });
      }

      const template = await get('SELECT * FROM checklist_templates WHERE id = ?', [templateId]);
      if (!template) {
        fs.unlinkSync(req.file.path);
        return res.status(404).json({
          success: false,
          error: 'Checklist não encontrado',
        });
      }

      // Criar ou atualizar resposta com foto
      const existing = await get(
        'SELECT * FROM checklist_responses WHERE template_id = ? AND item_id = ? AND reference_type = ? AND reference_id = ?',
        [templateId, itemId, reference_type, reference_id]
      );

      const photoPath = `/uploads/checklists/${path.basename(req.file.path)}`;

      if (existing) {
        // Atualizar resposta existente
        await run(
          'UPDATE checklist_responses SET photo_path = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [photoPath, existing.id]
        );
      } else {
        // Criar nova resposta
        await run(
          `INSERT INTO checklist_responses
         (template_id, item_id, reference_type, reference_id, status, photo_path, responded_by, responded_at)
         VALUES (?, ?, ?, ?, 'completed', ?, ?, CURRENT_TIMESTAMP)`,
          [templateId, itemId, reference_type, reference_id, photoPath, req.user.id]
        );
      }

      res.status(201).json({
        success: true,
        message: 'Foto enviada com sucesso',
        data: {
          photo_path: photoPath,
          file_name: req.file.originalname,
        },
      });
    } catch (error) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      next(error);
    }
  }
);

// Servir arquivos de fotos de checklist
router.get('/photos/:filename', authenticate, (req, res, next) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(uploadDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'Arquivo não encontrado',
      });
    }

    res.sendFile(filePath);
  } catch (error) {
    next(error);
  }
});

// Endpoint para criar templates prontos profissionais
router.post('/seed-templates', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Templates profissionais de manutenção
    const professionalTemplates = [
      {
        name: 'Checklist Preventivo - Compressor de Ar',
        description:
          'Checklist completo para manutenção preventiva de compressores de ar industriais. Inclui verificação de pressão, temperatura, filtros, correias e sistema de lubrificação.',
        entity_type: 'preventive_plan',
        items: [
          {
            title: 'Verificar pressão de operação',
            instructions:
              'Medir a pressão de operação do compressor. Valores normais: 7-10 bar. Anotar valor atual.',
            input_type: 'number',
            required: true,
            requires_photo: false,
            requires_signature: false,
          },
          {
            title: 'Verificar temperatura de descarga',
            instructions:
              'Medir temperatura na saída do compressor. Temperatura máxima: 100°C. Verificar se está dentro do normal.',
            input_type: 'number',
            required: true,
            requires_photo: false,
            requires_signature: false,
          },
          {
            title: 'Inspecionar filtro de ar',
            instructions:
              'Verificar estado do filtro de ar. Trocar se necessário. Verificar indicador de sujeira.',
            input_type: 'boolean',
            required: true,
            requires_photo: true,
            requires_signature: false,
          },
          {
            title: 'Verificar correias',
            instructions:
              'Inspecionar correias quanto a desgaste, rachaduras ou folga excessiva. Verificar tensão adequada.',
            input_type: 'boolean',
            required: true,
            requires_photo: true,
            requires_signature: false,
          },
          {
            title: 'Verificar nível de óleo',
            instructions:
              'Verificar nível de óleo no visor. Completar se necessário com óleo recomendado pelo fabricante.',
            input_type: 'boolean',
            required: true,
            requires_photo: false,
            requires_signature: false,
          },
          {
            title: 'Verificar vazamentos',
            instructions:
              'Inspecionar todo o sistema em busca de vazamentos de ar. Verificar conexões, mangueiras e válvulas.',
            input_type: 'boolean',
            required: true,
            requires_photo: true,
            requires_signature: false,
          },
          {
            title: 'Limpeza geral',
            instructions:
              'Realizar limpeza externa do compressor, removendo poeira e sujeira acumulada. Verificar área ao redor.',
            input_type: 'boolean',
            required: false,
            requires_photo: false,
            requires_signature: false,
          },
          {
            title: 'Assinatura do técnico',
            instructions: 'Confirmar conclusão da manutenção preventiva.',
            input_type: 'boolean',
            required: true,
            requires_photo: false,
            requires_signature: true,
          },
        ],
      },
      {
        name: 'Checklist Preventivo - Bomba Centrífuga',
        description:
          'Checklist para manutenção preventiva de bombas centrífugas. Verificação de vedação, vibração, temperatura e condições gerais.',
        entity_type: 'preventive_plan',
        items: [
          {
            title: 'Verificar vedação mecânica',
            instructions:
              'Inspecionar vedação mecânica quanto a vazamentos. Verificar desgaste e necessidade de ajuste ou substituição.',
            input_type: 'boolean',
            required: true,
            requires_photo: true,
            requires_signature: false,
          },
          {
            title: 'Medir vibração',
            instructions:
              'Medir vibração com aparelho adequado. Valores aceitáveis: < 4.5 mm/s. Anotar valor medido.',
            input_type: 'number',
            required: true,
            requires_photo: false,
            requires_signature: false,
          },
          {
            title: 'Verificar temperatura dos rolamentos',
            instructions:
              'Medir temperatura dos rolamentos. Temperatura normal: ambiente + 40°C. Verificar se está dentro do normal.',
            input_type: 'number',
            required: true,
            requires_photo: false,
            requires_signature: false,
          },
          {
            title: 'Verificar nível de ruído',
            instructions:
              'Avaliar nível de ruído da bomba. Verificar se há ruídos anormais que indiquem problemas.',
            input_type: 'text',
            required: false,
            requires_photo: false,
            requires_signature: false,
          },
          {
            title: 'Inspecionar acoplamento',
            instructions:
              'Verificar estado do acoplamento, alinhamento e folga. Verificar desgaste ou danos.',
            input_type: 'boolean',
            required: true,
            requires_photo: true,
            requires_signature: false,
          },
          {
            title: 'Verificar base e fixação',
            instructions:
              'Verificar se a base está firme e se os parafusos de fixação estão apertados corretamente.',
            input_type: 'boolean',
            required: true,
            requires_photo: false,
            requires_signature: false,
          },
          {
            title: 'Assinatura do técnico',
            instructions: 'Confirmar conclusão da manutenção preventiva.',
            input_type: 'boolean',
            required: true,
            requires_photo: false,
            requires_signature: true,
          },
        ],
      },
      {
        name: 'Checklist Preventivo - Motor Elétrico',
        description:
          'Checklist para manutenção preventiva de motores elétricos trifásicos. Verificação elétrica, mecânica e térmica.',
        entity_type: 'preventive_plan',
        items: [
          {
            title: 'Medir isolamento (Megôhmetro)',
            instructions:
              'Medir resistência de isolamento entre fases e entre fase e terra. Valor mínimo: 1 MΩ. Anotar valores medidos.',
            input_type: 'number',
            required: true,
            requires_photo: false,
            requires_signature: false,
          },
          {
            title: 'Verificar temperatura dos rolamentos',
            instructions:
              'Medir temperatura dos rolamentos com termômetro infravermelho. Temperatura máxima: 80°C.',
            input_type: 'number',
            required: true,
            requires_photo: false,
            requires_signature: false,
          },
          {
            title: 'Inspecionar conexões elétricas',
            instructions:
              'Verificar se todas as conexões elétricas estão firmes e sem sinais de oxidação ou superaquecimento.',
            input_type: 'boolean',
            required: true,
            requires_photo: true,
            requires_signature: false,
          },
          {
            title: 'Verificar ventilação e limpeza',
            instructions:
              'Verificar se as aletas de refrigeração estão limpas e desobstruídas. Remover poeira e sujeira acumulada.',
            input_type: 'boolean',
            required: true,
            requires_photo: true,
            requires_signature: false,
          },
          {
            title: 'Verificar vibração',
            instructions:
              'Medir vibração do motor. Valores aceitáveis: < 2.8 mm/s. Verificar se está dentro do normal.',
            input_type: 'number',
            required: true,
            requires_photo: false,
            requires_signature: false,
          },
          {
            title: 'Verificar alinhamento',
            instructions:
              'Verificar alinhamento entre motor e equipamento acionado. Usar régua ou laser se necessário.',
            input_type: 'boolean',
            required: true,
            requires_photo: false,
            requires_signature: false,
          },
          {
            title: 'Assinatura do técnico',
            instructions: 'Confirmar conclusão da manutenção preventiva.',
            input_type: 'boolean',
            required: true,
            requires_photo: false,
            requires_signature: true,
          },
        ],
      },
      {
        name: 'Checklist Corretivo - Análise de Falha',
        description:
          'Checklist para análise detalhada de falhas em equipamentos. Documentação completa do problema e ações corretivas.',
        entity_type: 'maintenance_order',
        items: [
          {
            title: 'Descrição detalhada da falha',
            instructions:
              'Descrever detalhadamente o problema observado, sintomas e condições em que ocorreu.',
            input_type: 'text',
            required: true,
            requires_photo: true,
            requires_signature: false,
          },
          {
            title: 'Fotografar equipamento',
            instructions:
              'Tirar fotos do equipamento mostrando o estado atual, área afetada e componentes relacionados.',
            input_type: 'boolean',
            required: true,
            requires_photo: true,
            requires_signature: false,
          },
          {
            title: 'Identificar causa raiz',
            instructions:
              'Descrever a causa raiz identificada após análise. Usar metodologia 5 Porquês se necessário.',
            input_type: 'text',
            required: true,
            requires_photo: false,
            requires_signature: false,
          },
          {
            title: 'Ações corretivas realizadas',
            instructions:
              'Descrever todas as ações corretivas realizadas para resolver o problema.',
            input_type: 'text',
            required: true,
            requires_photo: true,
            requires_signature: false,
          },
          {
            title: 'Peças substituídas',
            instructions: 'Listar todas as peças substituídas com códigos e quantidades.',
            input_type: 'text',
            required: false,
            requires_photo: false,
            requires_signature: false,
          },
          {
            title: 'Teste de funcionamento',
            instructions:
              'Realizar teste de funcionamento após reparo. Verificar se o equipamento está operando normalmente.',
            input_type: 'boolean',
            required: true,
            requires_photo: false,
            requires_signature: false,
          },
          {
            title: 'Tempo de reparo',
            instructions: 'Registrar tempo total de reparo em horas.',
            input_type: 'number',
            required: true,
            requires_photo: false,
            requires_signature: false,
          },
          {
            title: 'Assinatura do técnico',
            instructions: 'Confirmar conclusão do reparo e análise.',
            input_type: 'boolean',
            required: true,
            requires_photo: false,
            requires_signature: true,
          },
        ],
      },
      {
        name: 'Checklist Preventivo - Sistema Hidráulico',
        description:
          'Checklist para manutenção preventiva de sistemas hidráulicos. Verificação de pressão, vazões, filtros e vazamentos.',
        entity_type: 'preventive_plan',
        items: [
          {
            title: 'Verificar pressão do sistema',
            instructions:
              'Medir pressão de operação do sistema hidráulico. Comparar com valores especificados.',
            input_type: 'number',
            required: true,
            requires_photo: false,
            requires_signature: false,
          },
          {
            title: 'Verificar nível de óleo hidráulico',
            instructions:
              'Verificar nível de óleo no reservatório. Completar se necessário com óleo do tipo correto.',
            input_type: 'boolean',
            required: true,
            requires_photo: false,
            requires_signature: false,
          },
          {
            title: 'Inspecionar filtros',
            instructions:
              'Verificar estado dos filtros hidráulicos. Trocar se necessário conforme indicador ou tempo de uso.',
            input_type: 'boolean',
            required: true,
            requires_photo: true,
            requires_signature: false,
          },
          {
            title: 'Verificar vazamentos',
            instructions:
              'Inspecionar todo o sistema em busca de vazamentos. Verificar mangueiras, conexões e selos.',
            input_type: 'boolean',
            required: true,
            requires_photo: true,
            requires_signature: false,
          },
          {
            title: 'Verificar temperatura do óleo',
            instructions:
              'Medir temperatura do óleo hidráulico. Temperatura ideal: 40-60°C. Verificar se está dentro do normal.',
            input_type: 'number',
            required: true,
            requires_photo: false,
            requires_signature: false,
          },
          {
            title: 'Verificar qualidade do óleo',
            instructions:
              'Avaliar qualidade do óleo através de análise visual ou teste de contaminação.',
            input_type: 'text',
            required: false,
            requires_photo: false,
            requires_signature: false,
          },
          {
            title: 'Assinatura do técnico',
            instructions: 'Confirmar conclusão da manutenção preventiva.',
            input_type: 'boolean',
            required: true,
            requires_photo: false,
            requires_signature: true,
          },
        ],
      },
      {
        name: 'Checklist Preventivo - Chiller',
        description:
          'Checklist para manutenção preventiva de chillers. Verificação de refrigeração, pressões, temperaturas e fluidos.',
        entity_type: 'preventive_plan',
        items: [
          {
            title: 'Verificar pressão de alta',
            instructions:
              'Medir pressão de alta do sistema de refrigeração. Comparar com valores especificados.',
            input_type: 'number',
            required: true,
            requires_photo: false,
            requires_signature: false,
          },
          {
            title: 'Verificar pressão de baixa',
            instructions:
              'Medir pressão de baixa do sistema de refrigeração. Comparar com valores especificados.',
            input_type: 'number',
            required: true,
            requires_photo: false,
            requires_signature: false,
          },
          {
            title: 'Verificar temperatura de entrada/saída',
            instructions:
              'Medir temperatura de entrada e saída da água. Verificar eficiência do sistema.',
            input_type: 'text',
            required: true,
            requires_photo: false,
            requires_signature: false,
          },
          {
            title: 'Limpar condensador',
            instructions:
              'Realizar limpeza do condensador removendo sujeira e detritos. Verificar estado das aletas.',
            input_type: 'boolean',
            required: true,
            requires_photo: true,
            requires_signature: false,
          },
          {
            title: 'Verificar nível de refrigerante',
            instructions:
              'Verificar nível de refrigerante através de visor ou manômetro. Completar se necessário.',
            input_type: 'boolean',
            required: true,
            requires_photo: false,
            requires_signature: false,
          },
          {
            title: 'Verificar filtros de água',
            instructions: 'Inspecionar e limpar filtros de água. Trocar se necessário.',
            input_type: 'boolean',
            required: true,
            requires_photo: true,
            requires_signature: false,
          },
          {
            title: 'Verificar vibração e ruído',
            instructions:
              'Avaliar vibração e ruído do compressor e componentes. Verificar se está dentro do normal.',
            input_type: 'text',
            required: false,
            requires_photo: false,
            requires_signature: false,
          },
          {
            title: 'Assinatura do técnico',
            instructions: 'Confirmar conclusão da manutenção preventiva.',
            input_type: 'boolean',
            required: true,
            requires_photo: false,
            requires_signature: true,
          },
        ],
      },
    ];

    const createdTemplates = [];

    await run('BEGIN TRANSACTION');
    try {
      for (const templateData of professionalTemplates) {
        // Verificar se já existe
        const existing = await get('SELECT id FROM checklist_templates WHERE name = ?', [
          templateData.name,
        ]);

        if (existing) {
          createdTemplates.push({ id: existing.id, name: templateData.name, status: 'exists' });
          continue;
        }

        // Criar template
        const templateResult = await run(
          `INSERT INTO checklist_templates (name, description, entity_type, entity_id, is_active, created_by)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [templateData.name, templateData.description, templateData.entity_type, null, 1, userId]
        );

        const templateId = templateResult.lastID;

        // Criar itens
        for (let i = 0; i < templateData.items.length; i++) {
          const item = templateData.items[i];
          await run(
            `INSERT INTO checklist_template_items
             (template_id, order_index, title, instructions, input_type, required, requires_photo, requires_signature)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              templateId,
              i,
              item.title,
              item.instructions,
              item.input_type,
              item.required ? 1 : 0,
              item.requires_photo ? 1 : 0,
              item.requires_signature ? 1 : 0,
            ]
          );
        }

        createdTemplates.push({ id: templateId, name: templateData.name, status: 'created' });
      }

      await run('COMMIT');

      res.json({
        success: true,
        message: `${
          createdTemplates.filter(t => t.status === 'created').length
        } templates criados com sucesso`,
        data: createdTemplates,
      });
    } catch (error) {
      await run('ROLLBACK');
      throw error;
    }
  } catch (error) {
    next(error);
  }
});

// Endpoint para gerar checklist com IA (Gemini) - Versão Inteligente com Contexto do Banco
router.post('/ai-generate', authenticate, async (req, res, next) => {
  try {
    const {
      prompt,
      equipment_id,
      entity_type,
      entity_id,
      equipment_name,
      equipment_code,
      manufacturer,
      model,
    } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Prompt é obrigatório',
      });
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;

    // Buscar informações detalhadas do equipamento no banco de dados
    let equipmentDetails = {};
    let equipmentInfo = '';

    if (equipment_id) {
      try {
        const equipment = await get('SELECT * FROM equipment WHERE id = ?', [equipment_id]);
        if (equipment) {
          equipmentDetails = {
            name: equipment.name,
            code: equipment.code,
            manufacturer: equipment.manufacturer,
            model: equipment.model,
            power: equipment.power,
            capacity: equipment.capacity,
            voltage: equipment.voltage,
            fuel_type: equipment.fuel_type,
            dimensions: equipment.dimensions,
            criticality: equipment.criticality,
            location: equipment.location,
            description: equipment.description,
          };

          equipmentInfo = [
            `Nome: ${equipment.name}`,
            equipment.code ? `Código: ${equipment.code}` : '',
            equipment.manufacturer ? `Fabricante: ${equipment.manufacturer}` : '',
            equipment.model ? `Modelo: ${equipment.model}` : '',
            equipment.power ? `Potência: ${equipment.power}` : '',
            equipment.capacity ? `Capacidade: ${equipment.capacity}` : '',
            equipment.voltage ? `Tensão: ${equipment.voltage}` : '',
            equipment.fuel_type ? `Tipo de Combustível: ${equipment.fuel_type}` : '',
            equipment.dimensions ? `Dimensões: ${equipment.dimensions}` : '',
            equipment.criticality ? `Criticidade: ${equipment.criticality}` : '',
            equipment.location ? `Localização: ${equipment.location}` : '',
            equipment.description ? `Descrição: ${equipment.description}` : '',
          ]
            .filter(Boolean)
            .join('\n');
        }
      } catch (dbError) {
        console.warn('Erro ao buscar detalhes do equipamento:', dbError);
      }
    } else if (equipment_name) {
      // Se não tiver equipment_id mas tiver nome, usar informações fornecidas
      equipmentInfo = [
        `Nome: ${equipment_name}`,
        equipment_code ? `Código: ${equipment_code}` : '',
        manufacturer ? `Fabricante: ${manufacturer}` : '',
        model ? `Modelo: ${model}` : '',
      ]
        .filter(Boolean)
        .join('\n');
    }

    // Buscar informações do plano preventivo se entity_type for preventive_plan
    let planInfo = '';
    if (entity_type === 'preventive_plan' && entity_id) {
      try {
        const plan = await get(
          `
          SELECT pp.*, e.name as equipment_name, e.code as equipment_code, e.manufacturer, e.model
          FROM preventive_plans pp
          LEFT JOIN equipment e ON pp.equipment_id = e.id
          WHERE pp.id = ?
        `,
          [entity_id]
        );

        if (plan) {
          planInfo = [
            `Plano: ${plan.name}`,
            plan.instructions ? `Instruções do Plano: ${plan.instructions.substring(0, 500)}` : '',
            plan.tools_required ? `Ferramentas Necessárias: ${plan.tools_required}` : '',
            plan.materials_required ? `Materiais Necessários: ${plan.materials_required}` : '',
            plan.safety_procedures
              ? `Procedimentos de Segurança: ${plan.safety_procedures.substring(0, 500)}`
              : '',
            plan.frequency_type && plan.frequency_value
              ? `Frequência: A cada ${plan.frequency_value} ${
                  plan.frequency_type === 'days'
                    ? 'dia(s)'
                    : plan.frequency_type === 'weeks'
                    ? 'semana(s)'
                    : plan.frequency_type === 'months'
                    ? 'mês(es)'
                    : plan.frequency_type === 'hours'
                    ? 'hora(s)'
                    : 'ciclo(s)'
                }`
              : '',
          ]
            .filter(Boolean)
            .join('\n');
        }
      } catch (dbError) {
        console.warn('Erro ao buscar informações do plano:', dbError);
      }
    }

    // Buscar informações da ordem de manutenção se entity_type for maintenance_order
    let orderInfo = '';
    if (entity_type === 'maintenance_order' && entity_id) {
      try {
        const order = await get(
          `
          SELECT mo.*, e.name as equipment_name, e.code as equipment_code, e.manufacturer, e.model
          FROM maintenance_orders mo
          LEFT JOIN equipment e ON mo.equipment_id = e.id
          WHERE mo.id = ?
        `,
          [entity_id]
        );

        if (order) {
          orderInfo = [
            `Ordem de Serviço #${order.id}`,
            order.description ? `Descrição: ${order.description}` : '',
            order.instructions ? `Instruções: ${order.instructions.substring(0, 500)}` : '',
            order.status ? `Status: ${order.status}` : '',
          ]
            .filter(Boolean)
            .join('\n');
        }
      } catch (dbError) {
        console.warn('Erro ao buscar informações da ordem:', dbError);
      }
    }

    if (!geminiApiKey) {
      // Fallback melhorado com contexto do banco
      return res.status(500).json({
        success: false,
        error:
          'GEMINI_API_KEY não configurada. Configure a chave da API para usar a geração inteligente de checklists.',
      });
    }

    // Integração com Gemini API usando contexto do banco
    try {
  console.log('[AI-GENERATE] Iniciando geração de checklist com Gemini (REST API)...');
      console.log('[AI-GENERATE] Contexto disponível:', {
        hasEquipmentInfo: !!equipmentInfo,
        hasPlanInfo: !!planInfo,
        hasOrderInfo: !!orderInfo,
        equipmentDetails: equipmentDetails.name || 'N/A',
      });
      console.log('[AI-GENERATE] Modelos candidatos:', GEMINI_MODEL_CANDIDATES.join(', '));

      // Construir informações do equipamento de forma mais completa
      const equipmentInfoText = [
        equipmentInfo ? `INFORMAÇÕES DO EQUIPAMENTO:\n${equipmentInfo}` : '',
        planInfo ? `\n\nINFORMAÇÕES DO PLANO PREVENTIVO:\n${planInfo}` : '',
        orderInfo ? `\n\nINFORMAÇÕES DA ORDEM DE MANUTENÇÃO:\n${orderInfo}` : '',
      ]
        .filter(Boolean)
        .join('\n');

      // Prompt simplificado e direto, seguindo o padrão dos planos
      const promptText = `Você é um técnico sênior de manutenção industrial especializado em criar checklists profissionais e detalhados.

${equipmentInfoText ? `${equipmentInfoText}\n\n` : ''}

TAREFA: Crie um checklist completo de manutenção baseado no prompt do usuário abaixo.

PROMPT DO USUÁRIO:
"${prompt}"

INSTRUÇÕES:
1. Use seu conhecimento técnico sobre o equipamento mencionado para criar itens específicos e precisos
2. Se o equipamento foi identificado (${equipmentDetails.manufacturer || 'N/A'} ${
        equipmentDetails.model || ''
      }), use conhecimento técnico específico sobre este modelo
3. Crie MÍNIMO 10-15 itens profissionais e detalhados
4. Organize os itens logicamente (segurança primeiro, depois por subsistema)
5. Seja específico sobre componentes, valores e procedimentos
6. Use o tipo de input apropriado:
   - "boolean" para verificações sim/não
   - "number" para medições (temperatura, pressão, etc.)
   - "text" para observações e descrições
7. Marque requires_photo: true para inspeções visuais importantes
8. O último item SEMPRE deve ter requires_signature: true

FORMATO DE RESPOSTA (retorne APENAS JSON válido, sem markdown):
{
  "name": "Nome completo e descritivo do checklist",
  "description": "Descrição detalhada do checklist",
  "entity_type": "${entity_type || 'preventive_plan'}",
  "items": [
    {
      "title": "Título claro do item",
      "instructions": "Instruções detalhadas e específicas",
      "input_type": "boolean",
      "required": true,
      "requires_photo": false,
      "requires_signature": false
    }
  ]
}

IMPORTANTE: Retorne APENAS o JSON, sem texto adicional, sem markdown, sem explicações.`;

      const parseJsonFromResponse = (text, label) => {
        if (!text) {
          console.warn(`[AI-GENERATE] Resposta vazia na ${label}.`);
          return null;
        }
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          console.warn(`[AI-GENERATE] JSON não encontrado na ${label}.`);
          return null;
        }
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (err) {
          console.warn(`[AI-GENERATE] Erro ao parsear JSON na ${label}:`, err.message);
          return null;
        }
      };

      const tryGenerate = async (textPrompt, options = {}) => {
        let lastError = null;
        for (const model of GEMINI_MODEL_CANDIDATES) {
          try {
            console.log(`[AI-GENERATE] Tentando geração com modelo: ${model}`);
            const response = await generateContentWithGemini(
              geminiApiKey,
              model,
              textPrompt,
              options
            );
            console.log(`[AI-GENERATE] Geração bem-sucedida com modelo: ${model}`);
            return response;
          } catch (err) {
            console.warn(`[AI-GENERATE] Falha com modelo ${model}: ${err.message}`);
            if (err.status === 401 || err.status === 403) {
              throw err; // credencial inválida, não adianta tentar outros
            }
            lastError = err;
            if (err.status && err.status !== 404) {
              // erro diferente de modelo inexistente; interromper tentativas
              break;
            }
          }
        }
        if (lastError) throw lastError;
        throw new Error('Não foi possível gerar conteúdo com nenhum modelo disponível.');
      };

      console.log('[AI-GENERATE] Enviando prompt para Gemini...');
      const firstResponse = await tryGenerate(promptText);
      let generatedText = firstResponse.generatedText || '';
      console.log('[AI-GENERATE] Resposta recebida, tamanho:', generatedText.length);

      // Se a resposta estiver muito curta ou não tiver JSON válido, tentar novamente com prompt mais direto
      let parsed = parseJsonFromResponse(generatedText, 'primeira tentativa');

      // Retry com prompt mais direto se não conseguiu parsear
      if (!parsed || !parsed.items || !Array.isArray(parsed.items) || parsed.items.length < 5) {
        console.log('[AI-GENERATE] Tentando segunda tentativa com prompt mais direto...');
        const retryPrompt = `Crie um checklist de manutenção em formato JSON para: ${prompt}

${
  equipmentInfoText
    ? `Equipamento: ${equipmentDetails.name || equipment_name || 'N/A'}\n${equipmentInfoText}`
    : ''
}

Retorne APENAS JSON válido neste formato:
{
  "name": "Nome do checklist",
  "description": "Descrição",
  "entity_type": "${entity_type || 'preventive_plan'}",
  "items": [
    {"title": "...", "instructions": "...", "input_type": "boolean", "required": true, "requires_photo": false, "requires_signature": false}
  ]
}`;

        try {
          const retryResponse = await tryGenerate(retryPrompt, {
            generationConfig: { temperature: 0.3 },
          });
          generatedText = retryResponse.generatedText || '';
          parsed = parseJsonFromResponse(generatedText, 'segunda tentativa');
          if (parsed) {
            console.log('[AI-GENERATE] Segunda tentativa bem-sucedida.');
          }
        } catch (retryError) {
          console.error('[AI-GENERATE] Erro na segunda tentativa:', retryError);
        }
      }

      // Validar e processar resposta
      if (parsed && parsed.items && Array.isArray(parsed.items) && parsed.items.length > 0) {
        // Validar estrutura básica
        if (!parsed.name) {
          parsed.name = `Checklist Gerado - ${
            equipmentDetails.name || equipment_name || 'Equipamento'
          }`;
        }
        if (!parsed.entity_type) {
          parsed.entity_type = entity_type || 'preventive_plan';
        }
        if (!parsed.description) {
          parsed.description = `Checklist gerado por IA${
            equipmentDetails.name ? ` para ${equipmentDetails.name}` : ''
          }`;
        }

        // Garantir que todos os itens têm todos os campos necessários
        parsed.items = parsed.items.map((item, index) => ({
          ...item,
          order_index: item.order_index !== undefined ? item.order_index : index,
          input_type: item.input_type || 'boolean',
          required: item.required !== undefined ? item.required : true,
          requires_photo: item.requires_photo || false,
          requires_signature: item.requires_signature || false,
        }));

        // Garantir que o último item tem assinatura
        if (parsed.items.length > 0) {
          const lastItem = parsed.items[parsed.items.length - 1];
          if (!lastItem.requires_signature) {
            parsed.items[parsed.items.length - 1] = {
              ...lastItem,
              requires_signature: true,
            };
          }
        }

        console.log('[AI-GENERATE] Checklist gerado com sucesso, itens:', parsed.items.length);
        return res.json({
          success: true,
          data: parsed,
        });
      }

      // Se não conseguir parsear, retornar erro
      console.warn(
        '[AI-GENERATE] Não foi possível parsear resposta da IA:',
        generatedText.substring(0, 500)
      );
      return res.status(500).json({
        success: false,
        error:
          'Não foi possível processar a resposta da IA. Tente novamente ou simplifique o prompt.',
        details: 'A resposta da IA não estava no formato JSON esperado.',
        debug: generatedText.substring(0, 200),
      });
    } catch (aiError) {
      console.error('[AI-GENERATE] Erro na integração com Gemini:', aiError);
      console.error('[AI-GENERATE] Stack:', aiError.stack);

      if (aiError.status === 404) {
        return res.status(404).json({
          success: false,
          error:
            'Modelo Gemini não encontrado para esta conta. Verifique se a API Generative Language está habilitada, se o faturamento está ativo e se o modelo "gemini-1.5-flash-latest" está disponível para o seu projeto.',
          details: aiError.payload?.error?.message || aiError.message,
          docs: 'https://ai.google.dev/gemini-api/docs/models/gemini',
        });
      }

      if (aiError.status === 401 || aiError.status === 403) {
        return res.status(aiError.status).json({
          success: false,
          error:
            'A chave configurada em GEMINI_API_KEY não foi aceita pela API. Confirme se a chave é válida e se possui acesso à Gemini API.',
          details: aiError.payload?.error?.message || aiError.message,
        });
      }

      // Tratamento específico para erro de quota
      if (
        aiError.message &&
        (aiError.message.includes('429') ||
          aiError.message.includes('quota') ||
          aiError.message.includes('Quota'))
      ) {
        return res.status(429).json({
          success: false,
          error:
            'Quota da API do Gemini excedida. Por favor, aguarde alguns minutos ou verifique seu plano e faturamento.',
          details:
            'Você excedeu sua quota atual. Verifique: https://ai.google.dev/gemini-api/docs/rate-limits',
          retryAfter: 60, // Sugerir retry após 60 segundos
        });
      }

      return res.status(500).json({
        success: false,
        error: aiError.message || 'Erro ao gerar checklist com IA.',
        details: aiError.stack || 'Erro desconhecido na integração com Gemini',
      });
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;

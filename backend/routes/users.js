const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { z } = require('zod');
const { query, get, run } = require('../database');
const { authenticate, authorize } = require('../middleware/auth');

// Schema de validação para criação
const createUserSchema = z.object({
  username: z.string().min(3, 'Username deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  full_name: z.string().optional(),
  department: z.string().optional(),
  role: z.enum(['admin', 'manager', 'technician', 'requester']).default('requester'),
});

// Schema de validação para atualização
const updateUserSchema = z.object({
  username: z.string().min(3).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  full_name: z.string().optional(),
  department: z.string().optional(),
  role: z.enum(['admin', 'manager', 'technician', 'requester']).optional(),
  photo_url: z.string().optional().nullable(),
});

// Listar todos os usuários (apenas admin e manager)
router.get('/', authenticate, authorize('admin', 'manager'), async (req, res, next) => {
  try {
    const users = await query(
      'SELECT id, username, email, role, full_name, department, photo_url, created_at, updated_at FROM users ORDER BY created_at DESC'
    );

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
});

// Listar técnicos (para atribuição de chamados)
router.get('/technicians', authenticate, authorize('admin', 'manager'), async (req, res, next) => {
  try {
    const technicians = await query(
      `SELECT id, username, email, full_name, department 
       FROM users 
       WHERE role IN ('admin', 'manager', 'technician')
       ORDER BY full_name, username`
    );

    res.json({
      success: true,
      data: technicians,
    });
  } catch (error) {
    next(error);
  }
});

// Obter usuário específico
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    // Usuários só podem ver seus próprios dados, exceto admin/manager
    if (req.user.role !== 'admin' && req.user.role !== 'manager' && req.user.id !== parseInt(req.params.id)) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado',
      });
    }

    const user = await get(
      'SELECT id, username, email, role, full_name, department, photo_url, created_at, updated_at FROM users WHERE id = ?',
      [req.params.id]
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

// Criar novo usuário (apenas admin)
router.post('/', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const data = createUserSchema.parse(req.body);

    // Verificar se username ou email já existe
    const existingUser = await get(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [data.username, data.email]
    );

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Username ou email já cadastrado',
      });
    }

    // Hash da senha
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Criar usuário
    const result = await run(
      `INSERT INTO users (username, email, password_hash, role, full_name, department)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        data.username,
        data.email,
        passwordHash,
        data.role,
        data.full_name || null,
        data.department || null,
      ]
    );

    // Buscar usuário criado (sem senha)
    const newUser = await get(
      'SELECT id, username, email, role, full_name, department, created_at FROM users WHERE id = ?',
      [result.lastID]
    );

    res.status(201).json({
      success: true,
      message: 'Usuário criado com sucesso',
      data: newUser,
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

// Atualizar usuário
router.put('/:id', authenticate, async (req, res, next) => {
  try {
    // Apenas admin pode atualizar qualquer usuário, outros só podem atualizar a si mesmos
    if (req.user.role !== 'admin' && req.user.id !== parseInt(req.params.id)) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado',
      });
    }

    const data = updateUserSchema.parse(req.body);

    // Verificar se usuário existe
    const existingUser = await get('SELECT id FROM users WHERE id = ?', [req.params.id]);

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado',
      });
    }

    // Verificar se username ou email já existe (se estiver sendo alterado)
    if (data.username || data.email) {
      const duplicateUser = await get(
        'SELECT id FROM users WHERE (username = ? OR email = ?) AND id != ?',
        [data.username || '', data.email || '', req.params.id]
      );

      if (duplicateUser) {
        return res.status(400).json({
          success: false,
          error: 'Username ou email já cadastrado',
        });
      }
    }

    // Construir query de atualização
    const updates = [];
    const values = [];

    if (data.username) {
      updates.push('username = ?');
      values.push(data.username);
    }
    if (data.email) {
      updates.push('email = ?');
      values.push(data.email);
    }
    if (data.password) {
      const passwordHash = await bcrypt.hash(data.password, 10);
      updates.push('password_hash = ?');
      values.push(passwordHash);
    }
    if (data.full_name !== undefined) {
      updates.push('full_name = ?');
      values.push(data.full_name);
    }
    if (data.department !== undefined) {
      updates.push('department = ?');
      values.push(data.department);
    }
    if (data.photo_url !== undefined) {
      updates.push('photo_url = ?');
      values.push(data.photo_url);
    }
    // Apenas admin pode alterar role
    if (data.role && req.user.role === 'admin') {
      updates.push('role = ?');
      values.push(data.role);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(req.params.id);

    if (updates.length === 1) {
      return res.status(400).json({
        success: false,
        error: 'Nenhum campo para atualizar',
      });
    }

    await run(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    // Buscar usuário atualizado
    const updatedUser = await get(
      'SELECT id, username, email, role, full_name, department, photo_url, updated_at FROM users WHERE id = ?',
      [req.params.id]
    );

    res.json({
      success: true,
      message: 'Usuário atualizado com sucesso',
      data: updatedUser,
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

// Deletar usuário (apenas admin)
router.delete('/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    // Não permitir deletar a si mesmo
    if (req.user.id === parseInt(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: 'Não é possível deletar seu próprio usuário',
      });
    }

    const result = await run('DELETE FROM users WHERE id = ?', [req.params.id]);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado',
      });
    }

    res.json({
      success: true,
      message: 'Usuário deletado com sucesso',
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

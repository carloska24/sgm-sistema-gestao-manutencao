const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { z } = require('zod');
const rateLimit = require('express-rate-limit');
const { get, run } = require('../database');
const { generateToken, authenticate } = require('../middleware/auth');

// Rate limiter específico para login (mais permissivo)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.NODE_ENV === 'production' ? 20 : 100, // 20 tentativas em produção, 100 em dev
  message: 'Muitas tentativas de login. Tente novamente em alguns minutos.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Não conta tentativas bem-sucedidas
});

// Schema de validação para login
const loginSchema = z.object({
  username: z.string().min(1, 'Username é obrigatório'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

// Schema de validação para registro
const registerSchema = z.object({
  username: z.string().min(3, 'Username deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  full_name: z.string().optional(),
  department: z.string().optional(),
  role: z.enum(['admin', 'manager', 'technician', 'requester']).default('requester'),
});

// Rota de login (com rate limiting específico)
router.post('/login', loginLimiter, async (req, res, next) => {
  try {
    // Validar dados
    const { username, password } = loginSchema.parse(req.body);

    // Buscar usuário
    const user = await get(
      'SELECT id, username, email, password_hash, role, full_name, department FROM users WHERE username = ? OR email = ?',
      [username, username]
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Credenciais inválidas',
      });
    }

    // Verificar senha
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Credenciais inválidas',
      });
    }

    // Gerar token
    const token = generateToken(user.id);

    // Remover password_hash da resposta
    const { password_hash, ...userWithoutPassword } = user;

    // Enviar resposta com token
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 horas
    });

    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      data: {
        user: userWithoutPassword,
        token,
      },
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

// Rota de registro (apenas para admin em produção)
router.post('/register', async (req, res, next) => {
  try {
    // Validar dados
    const data = registerSchema.parse(req.body);

    // Verificar se username já existe
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

    // Gerar token
    const token = generateToken(result.lastID);

    res.status(201).json({
      success: true,
      message: 'Usuário criado com sucesso',
      data: {
        userId: result.lastID,
        token,
      },
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

// Rota para obter usuário atual
router.get('/me', authenticate, async (req, res) => {
  res.json({
    success: true,
    data: req.user,
  });
});

// Rota de logout
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({
    success: true,
    message: 'Logout realizado com sucesso',
  });
});

module.exports = router;

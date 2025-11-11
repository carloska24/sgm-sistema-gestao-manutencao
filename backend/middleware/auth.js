const jwt = require('jsonwebtoken');
const { get } = require('../database');

const JWT_SECRET = process.env.JWT_SECRET || 'sgm_secret_key_change_in_production';

// Middleware de autenticação
exports.authenticate = async (req, res, next) => {
  try {
    // Verificar token no header Authorization ou cookie
    const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token não fornecido',
      });
    }

    // Verificar e decodificar token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Buscar usuário no banco
    const user = await get('SELECT id, username, email, role, full_name, department, photo_url FROM users WHERE id = ?', [decoded.userId]);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não encontrado',
      });
    }

    // Adicionar usuário ao request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Token inválido',
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expirado',
      });
    }
    next(error);
  }
};

// Middleware de autorização por role
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Autenticação necessária',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado. Permissão insuficiente.',
      });
    }

    next();
  };
};

// Helper para gerar token
exports.generateToken = (userId) => {
  return jwt.sign(
    { userId },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRATION || '24h' }
  );
};


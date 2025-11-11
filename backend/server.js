require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

// Servir arquivos estáticos de upload
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate limiting - desabilitado em desenvolvimento, ativo em produção
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.NODE_ENV === 'production' ? 100 : 10000, // 10000 em dev (praticamente desabilitado), 100 em produção
  message: 'Muitas requisições deste IP, tente novamente mais tarde.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
});

// Aplicar rate limiting apenas em produção
if (process.env.NODE_ENV === 'production') {
  app.use('/api/', limiter);
} else {
  // Em desenvolvimento, aplicar um limite muito alto (praticamente desabilitado)
  app.use('/api/', limiter);
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'SGM Backend está funcionando',
    timestamp: new Date().toISOString(),
  });
});

// Rotas da API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/calls', require('./routes/calls'));
app.use('/api/plans', require('./routes/plans'));
app.use('/api/maintenance', require('./routes/maintenance'));
app.use('/api/equipment', require('./routes/equipment'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/demo', require('./routes/demo'));
app.use('/api/checklists', require('./routes/checklists'));
app.use('/api/inventory', require('./routes/inventory'));

// Rota 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Rota não encontrada',
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Erro:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Erro interno do servidor',
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 SGM Backend rodando na porta ${PORT}`);
  console.log(`📡 Ambiente: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;


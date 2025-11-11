# 🏗️ Arquitetura Técnica - SGM

**Versão:** 1.0  
**Data:** 11/01/2025  
**Responsável:** Arquiteto de Software

---

## 📐 Visão Geral da Arquitetura

### Arquitetura de Alto Nível
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│   Backend   │────▶│   Database  │
│  (Next.js)  │     │  (Express)  │     │  (SQLite/   │
│             │◀────│             │◀────│  PostgreSQL)│
└─────────────┘     └─────────────┘     └─────────────┘
      │                    │                    │
      │                    │                    │
      ▼                    ▼                    ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Storage   │     │   Email     │     │   Jobs      │
│   (Files)   │     │   Service   │     │  (Cron)     │
└─────────────┘     └─────────────┘     └─────────────┘
```

---

## 🎨 Frontend Architecture

### Stack Tecnológica
- **Framework:** Next.js 16+ (App Router)
- **UI Library:** React 18+
- **Language:** TypeScript 5+
- **Styling:** Tailwind CSS 3.4+
- **Animations:** Framer Motion 11+
- **Icons:** Lucide React
- **Tables:** TanStack React Table
- **Charts:** Chart.js + React Chart.js 2
- **Forms:** React Hook Form (recomendado)
- **State Management:** Context API + React Hooks

### Estrutura de Pastas
```
nextjs-frontend/
├── app/                    # App Router (Next.js 13+)
│   ├── (auth)/            # Grupo de rotas de autenticação
│   │   └── login/
│   ├── (dashboard)/       # Grupo de rotas do dashboard
│   │   ├── dashboard/
│   │   ├── equipment/
│   │   ├── calls/
│   │   ├── plans/
│   │   └── reports/
│   ├── layout.tsx         # Layout principal
│   ├── page.tsx           # Página inicial
│   └── globals.css        # Estilos globais
│
├── components/            # Componentes React
│   ├── ui/                # Componentes UI base
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Dialog.tsx
│   │   ├── Toast.tsx
│   │   └── Badge.tsx
│   ├── layout/           # Componentes de layout
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── Breadcrumbs.tsx
│   ├── equipment/        # Componentes de equipamentos
│   ├── calls/            # Componentes de chamados
│   ├── plans/            # Componentes de planos
│   └── charts/           # Componentes de gráficos
│
├── lib/                  # Bibliotecas utilitárias
│   ├── api.ts            # Cliente API
│   ├── utils.ts          # Funções utilitárias
│   ├── auth.ts           # Utilitários de autenticação
│   └── validations.ts    # Schemas Zod
│
├── hooks/                # Custom Hooks
│   ├── useAuth.ts
│   ├── useToast.ts
│   ├── useEquipment.ts
│   ├── useCalls.ts
│   └── usePlans.ts
│
├── contexts/             # Context Providers
│   ├── AuthContext.tsx
│   └── ToastContext.tsx
│
├── types/                # Tipos TypeScript
│   ├── index.ts
│   ├── equipment.ts
│   ├── calls.ts
│   └── plans.ts
│
└── public/              # Arquivos estáticos
```

### Padrões de Componentes

#### Component Pattern
```typescript
// Componente funcional com TypeScript
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface ComponentProps {
  // Props tipadas
}

export default function Component({ ...props }: ComponentProps) {
  // Lógica do componente
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Conteúdo */}
    </motion.div>
  );
}
```

#### API Client Pattern
```typescript
// lib/api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export async function fetchData<T>(endpoint: string, options?: RequestInit): Promise<T> {
  // Implementação com tratamento de erros
}
```

---

## ⚙️ Backend Architecture

### Stack Tecnológica
- **Runtime:** Node.js (LTS)
- **Framework:** Express 5+
- **Language:** JavaScript (ES6+)
- **Database:** SQLite3 (dev) / PostgreSQL (prod)
- **Auth:** JWT (jsonwebtoken) + bcrypt
- **Validation:** Zod
- **Security:** CORS, cookie-parser, express-rate-limit
- **Logging:** Morgan
- **Scheduling:** node-cron

### Estrutura de Pastas
```
backend/
├── server.js              # Servidor principal
├── database.js            # Configuração do banco
│
├── routes/                 # Rotas da API
│   ├── auth.js
│   ├── users.js
│   ├── equipment.js
│   ├── calls.js
│   ├── plans.js
│   ├── preventive.js
│   ├── reports.js
│   └── dashboard.js
│
├── controllers/           # Lógica de negócio
│   ├── authController.js
│   ├── equipmentController.js
│   ├── callsController.js
│   └── plansController.js
│
├── models/                # Modelos de dados
│   ├── User.js
│   ├── Equipment.js
│   ├── MaintenanceCall.js
│   └── MaintenancePlan.js
│
├── middleware/            # Middlewares customizados
│   ├── auth.js           # Autenticação JWT
│   ├── authorize.js      # Autorização por role
│   ├── validate.js      # Validação de dados
│   └── errorHandler.js  # Tratamento de erros
│
├── services/              # Serviços de negócio
│   ├── emailService.js
│   ├── notificationService.js
│   ├── fileService.js
│   └── reportService.js
│
├── utils/                 # Utilitários
│   ├── logger.js
│   ├── validators.js
│   └── helpers.js
│
├── jobs/                  # Jobs agendados
│   └── generatePreventiveOS.js
│
├── queries/               # Queries SQL
│   ├── equipmentQueries.js
│   ├── callsQueries.js
│   └── reportsQueries.js
│
├── tests/                 # Testes
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
└── scripts/               # Scripts utilitários
    ├── migrate.js
    └── seed.js
```

### Padrão de Rota
```javascript
// routes/equipment.js
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const equipmentController = require('../controllers/equipmentController');

router.get('/', authenticate, authorize(['admin', 'manager']), equipmentController.list);
router.get('/:id', authenticate, equipmentController.getById);
router.post('/', authenticate, authorize(['admin', 'manager']), equipmentController.create);
router.put('/:id', authenticate, authorize(['admin', 'manager']), equipmentController.update);
router.delete('/:id', authenticate, authorize(['admin']), equipmentController.delete);

module.exports = router;
```

### Padrão de Controller
```javascript
// controllers/equipmentController.js
const equipmentService = require('../services/equipmentService');

exports.list = async (req, res, next) => {
  try {
    const equipment = await equipmentService.list(req.query);
    res.json({ success: true, data: equipment });
  } catch (error) {
    next(error);
  }
};
```

---

## 🗄️ Database Architecture

### Schema Principal

#### Tabela: users
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'user', -- 'admin', 'manager', 'technician', 'requester'
  full_name TEXT,
  department TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### Tabela: equipment
```sql
CREATE TABLE equipment (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL, -- Código de identificação (patrimônio/tag)
  description TEXT,
  model TEXT,
  manufacturer TEXT,
  serial_number TEXT,
  acquisition_date DATE,
  acquisition_cost DECIMAL(10,2),
  location TEXT,
  status TEXT DEFAULT 'active', -- 'active', 'inactive', 'maintenance', 'deactivated'
  criticality TEXT DEFAULT 'medium', -- 'low', 'medium', 'high'
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
  mtbf DECIMAL(10,2), -- Calculado
  mttr DECIMAL(10,2), -- Calculado
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### Tabela: maintenance_calls
```sql
CREATE TABLE maintenance_calls (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  equipment_id INTEGER NOT NULL,
  type TEXT NOT NULL, -- 'corrective', 'preventive'
  priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  status TEXT DEFAULT 'open', -- 'open', 'analysis', 'assigned', 'execution', 'waiting_parts', 'completed', 'cancelled'
  problem_type TEXT,
  description TEXT NOT NULL,
  occurrence_date DATETIME,
  -- Atribuição
  assigned_to INTEGER,
  assigned_at DATETIME,
  -- Execução
  started_at DATETIME,
  completed_at DATETIME,
  execution_time INTEGER, -- em minutos
  -- Relacionamentos
  created_by INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (equipment_id) REFERENCES equipment(id),
  FOREIGN KEY (assigned_to) REFERENCES users(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);
```

#### Tabela: maintenance_plans
```sql
CREATE TABLE maintenance_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  frequency_type TEXT NOT NULL, -- 'time', 'counter'
  frequency_value INTEGER NOT NULL,
  frequency_unit TEXT, -- 'days', 'weeks', 'months', 'hours', 'km'
  created_by INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);
```

#### Tabela: plan_equipment (Many-to-Many)
```sql
CREATE TABLE plan_equipment (
  plan_id INTEGER NOT NULL,
  equipment_id INTEGER NOT NULL,
  PRIMARY KEY (plan_id, equipment_id),
  FOREIGN KEY (plan_id) REFERENCES maintenance_plans(id),
  FOREIGN KEY (equipment_id) REFERENCES equipment(id)
);
```

#### Tabela: plan_tasks (Checklist)
```sql
CREATE TABLE plan_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_id INTEGER NOT NULL,
  description TEXT NOT NULL,
  estimated_time INTEGER, -- em minutos
  order_index INTEGER,
  FOREIGN KEY (plan_id) REFERENCES maintenance_plans(id)
);
```

#### Tabela: preventive_orders
```sql
CREATE TABLE preventive_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_id INTEGER NOT NULL,
  equipment_id INTEGER NOT NULL,
  scheduled_date DATETIME NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'scheduled', 'execution', 'completed', 'overdue', 'cancelled'
  assigned_to INTEGER,
  started_at DATETIME,
  completed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (plan_id) REFERENCES maintenance_plans(id),
  FOREIGN KEY (equipment_id) REFERENCES equipment(id),
  FOREIGN KEY (assigned_to) REFERENCES users(id)
);
```

#### Tabela: order_execution (Checklist de Execução)
```sql
CREATE TABLE order_execution (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  task_id INTEGER NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_by INTEGER,
  completed_at DATETIME,
  notes TEXT,
  FOREIGN KEY (order_id) REFERENCES preventive_orders(id),
  FOREIGN KEY (task_id) REFERENCES plan_tasks(id),
  FOREIGN KEY (completed_by) REFERENCES users(id)
);
```

#### Tabela: equipment_documents
```sql
CREATE TABLE equipment_documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  equipment_id INTEGER NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  document_type TEXT, -- 'manual', 'scheme', 'invoice', 'image'
  uploaded_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (equipment_id) REFERENCES equipment(id),
  FOREIGN KEY (uploaded_by) REFERENCES users(id)
);
```

#### Tabela: call_history (Logs de Auditoria)
```sql
CREATE TABLE call_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  call_id INTEGER NOT NULL,
  action TEXT NOT NULL, -- 'created', 'assigned', 'status_changed', 'activity_added'
  old_value TEXT,
  new_value TEXT,
  performed_by INTEGER,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (call_id) REFERENCES maintenance_calls(id),
  FOREIGN KEY (performed_by) REFERENCES users(id)
);
```

### Índices Recomendados
```sql
-- Performance
CREATE INDEX idx_equipment_code ON equipment(code);
CREATE INDEX idx_equipment_status ON equipment(status);
CREATE INDEX idx_calls_equipment ON maintenance_calls(equipment_id);
CREATE INDEX idx_calls_status ON maintenance_calls(status);
CREATE INDEX idx_calls_assigned ON maintenance_calls(assigned_to);
CREATE INDEX idx_preventive_scheduled ON preventive_orders(scheduled_date);
CREATE INDEX idx_preventive_status ON preventive_orders(status);
```

---

## 🔐 Segurança

### Autenticação
- JWT tokens com expiração de 24h
- Refresh tokens (opcional)
- Senhas hasheadas com bcrypt (10 rounds)

### Autorização
- RBAC (Role-Based Access Control)
- Middleware de autorização por role
- Proteção de rotas no frontend

### Validação
- Validação de dados com Zod
- Sanitização de inputs
- Rate limiting (100 req/15min)

### Criptografia
- HTTPS em produção
- Dados sensíveis criptografados
- Secrets em variáveis de ambiente

---

## 📦 Integrações

### Email Service
- Nodemailer ou SendGrid
- Templates de email
- Fila de emails (Bull/BullMQ)

### File Storage
- Desenvolvimento: Sistema de arquivos local
- Produção: AWS S3 ou similar

### Job Scheduling
- node-cron para jobs agendados
- Geração automática de OS preventivas

---

## 🚀 Deploy e Infraestrutura

### Desenvolvimento
- Frontend: `npm run dev` (porta 3000)
- Backend: `npm run dev` (porta 3001)
- Database: SQLite3 local

### Produção
- Frontend: Vercel/Netlify ou servidor próprio
- Backend: PM2 ou Docker
- Database: PostgreSQL (AWS RDS ou similar)
- Storage: AWS S3 ou similar
- Monitoring: Sentry, DataDog ou similar

### CI/CD
- GitHub Actions ou similar
- Testes automatizados
- Deploy automático em staging
- Deploy manual em produção

---

## 📊 Métricas e Monitoramento

### Métricas de Aplicação
- Tempo de resposta das APIs
- Taxa de erro
- Uso de memória e CPU
- Queries lentas

### Métricas de Negócio
- Total de equipamentos
- Chamados abertos/concluídos
- Taxa de conformidade preventiva
- MTBF e MTTR médios

### Logs
- Logs estruturados (JSON)
- Níveis: error, warn, info, debug
- Rotação de logs

---

## 🔄 Versionamento e Padrões

### API Versioning
- `/api/v1/...` (futuro: v2, v3)

### Código
- ESLint + Prettier
- Conventional Commits
- Code Review obrigatório

### Documentação
- JSDoc para funções
- README por módulo
- API Documentation (Swagger/OpenAPI)

---

**Última atualização:** 11/01/2025  
**Próxima revisão:** A cada sprint


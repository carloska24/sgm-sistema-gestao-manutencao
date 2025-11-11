# 🚀 Guia de Início Rápido - SGM

## ✅ FASE 1 COMPLETA!

A FASE 1 (Fundação e Autenticação) foi implementada com sucesso!

---

## 🎯 Como Começar

### 1. Instalar Dependências (se ainda não fez)

```bash
# Backend
cd sgm/backend
npm install

# Frontend
cd ../nextjs-frontend
npm install
```

### 2. Criar Usuário Administrador

```bash
cd sgm/backend
node scripts/create-admin.js
```

Ou com parâmetros customizados:
```bash
node scripts/create-admin.js admin admin@sgm.com admin123 "Nome do Admin"
```

### 3. Iniciar os Servidores

**Opção 1: Script Automático**
```bash
cd sgm
INICIAR-AMBOS.bat
```

**Opção 2: Manual**
```bash
# Terminal 1 - Backend
cd sgm/backend
npm run dev

# Terminal 2 - Frontend
cd sgm/nextjs-frontend
npm run dev
```

### 4. Acessar o Sistema

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001
- **Health Check:** http://localhost:3001/api/health

### 5. Fazer Login

Use as credenciais criadas pelo script:
- **Username:** admin (ou o que você definiu)
- **Senha:** admin123 (ou a que você definiu)

---

## 📋 Funcionalidades Implementadas

### ✅ Autenticação
- Login com JWT
- Logout
- Verificação de autenticação
- Proteção de rotas

### ✅ Autorização (RBAC)
- 4 roles: admin, manager, technician, requester
- Menu dinâmico por role
- Proteção de rotas por role

### ✅ Gestão de Usuários
- CRUD completo de usuários
- Apenas admin pode criar/editar/deletar
- Validação de dados

### ✅ Dashboard
- Cards de estatísticas
- Visualização de métricas básicas
- Layout responsivo

### ✅ Layout
- Header com informações do usuário
- Sidebar com navegação
- Proteção automática de rotas

---

## 🔐 Roles e Permissões

### Admin
- Acesso total ao sistema
- Pode gerenciar usuários
- Pode ver todos os relatórios

### Manager (Gerente de Manutenção)
- Gerencia equipamentos
- Gerencia chamados
- Gerencia planos preventivos
- Vê relatórios

### Technician (Técnico)
- Visualiza e executa chamados atribuídos
- Visualiza e executa preventivas atribuídas
- Registra atividades

### Requester (Solicitante)
- Abre chamados corretivos
- Visualiza status dos próprios chamados

---

## 📁 Estrutura de Arquivos

```
sgm/
├── backend/
│   ├── middleware/
│   │   └── auth.js          # Autenticação e autorização
│   ├── routes/
│   │   ├── auth.js          # Login, logout, registro
│   │   ├── users.js         # CRUD de usuários
│   │   └── dashboard.js     # Estatísticas
│   └── scripts/
│       └── create-admin.js  # Criar usuário admin
│
├── nextjs-frontend/
│   ├── app/
│   │   ├── login/           # Página de login
│   │   └── dashboard/       # Dashboard principal
│   ├── components/
│   │   └── layout/          # Header, Sidebar, MainLayout
│   └── contexts/
│       └── AuthContext.tsx  # Context de autenticação
│
└── docs/
    ├── PLANO-DE-DESENVOLVIMENTO.md
    ├── TODOS-POR-SPRINT.md
    ├── ARQUITETURA-TECNICA.md
    └── PROGRESSO.md
```

---

## 🐛 Troubleshooting

### Erro: "Token não fornecido"
- Verifique se está logado
- Limpe o localStorage e faça login novamente

### Erro: "Usuário não encontrado"
- Crie um usuário admin com o script
- Verifique se o banco de dados foi criado

### Frontend não conecta ao backend
- Verifique se o backend está rodando na porta 3001
- Verifique a variável `NEXT_PUBLIC_API_URL` se estiver usando

### Banco de dados não cria
- Verifique permissões da pasta
- Verifique se o SQLite3 está instalado

---

## 📚 Documentação

- **Plano de Desenvolvimento:** `docs/PLANO-DE-DESENVOLVIMENTO.md`
- **To-Dos por Sprint:** `docs/TODOS-POR-SPRINT.md`
- **Arquitetura Técnica:** `docs/ARQUITETURA-TECNICA.md`
- **Progresso:** `docs/PROGRESSO.md`

---

## 🎉 Próximos Passos

A FASE 2 (Cadastro de Equipamentos) está pronta para começar!

**Status:** 🟢 FASE 1 COMPLETA - Pronto para desenvolvimento contínuo

---

**Última atualização:** 11/01/2025


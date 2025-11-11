# SGM - Sistema de Gestão da Manutenção

Sistema completo para gestão e controle de manutenção de equipamentos.

## 🚀 Tecnologias

### Frontend
- Next.js 16+ (App Router)
- React 18+
- TypeScript 5+
- Tailwind CSS 3.4+
- Framer Motion 11+
- Lucide React
- Chart.js

### Backend
- Node.js
- Express 5+
- SQLite3
- JWT + bcrypt
- Zod

## 📁 Estrutura do Projeto

```
sgm/
├── nextjs-frontend/     # Frontend Next.js
├── backend/            # Backend Express
└── exemplo/            # Documentação de padrões
```

## 🛠️ Instalação e Inicialização

### Opção 1: Script Automático (Recomendado)

**Windows (Batch):**
```bash
INICIAR-AMBOS.bat
```

**Windows (PowerShell):**
```powershell
.\INICIAR-AMBOS.ps1
```

Os scripts irão:
- Verificar se as dependências estão instaladas
- Instalar automaticamente se necessário
- Iniciar backend e frontend em janelas separadas

### Opção 2: Manual

**Frontend:**
```bash
cd nextjs-frontend
npm install
npm run dev
```

**Backend:**
```bash
cd backend
npm install
npm run dev
```

O frontend estará disponível em `http://localhost:3000`  
O backend estará disponível em `http://localhost:3001`

## 📝 Variáveis de Ambiente

Crie um arquivo `.env` no diretório `backend/` baseado no `.env.example`:

```env
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
DB_PATH=./sgm.db
JWT_SECRET=seu_jwt_secret_aqui
JWT_EXPIRATION=24h
```

## 🗄️ Banco de Dados

O banco de dados SQLite é criado automaticamente na primeira execução do backend. As tabelas são:

- `users` - Usuários do sistema
- `equipment` - Equipamentos
- `maintenance_orders` - Ordens de manutenção
- `maintenance_history` - Histórico de manutenções

## 🎨 Padrões de Design

- **Background:** `#0f172a` (slate-950)
- **Primário:** `#22c55e` (green-500)
- **Painéis:** `#1e293b` (slate-900)
- **Fontes:** Inter (corpo), Poppins (títulos), Roboto Mono (código)

## 📚 Documentação

Consulte a pasta `exemplo/` para:
- Padrões de projeto (`PADRAO-PROJETO.md`)
- Instruções para Cursor AI (`INSTRUCOES-CURSOR.md`)

## ✅ Checklist de Desenvolvimento

- [x] Estrutura de pastas criada
- [x] Dependências instaladas
- [x] Configurações criadas
- [x] Componentes UI base criados
- [x] Backend básico configurado
- [ ] Autenticação implementada
- [ ] Módulos de gestão implementados
- [ ] Relatórios e gráficos
- [ ] Testes

## 🚀 Deploy e Hospedagem

Para fazer deploy do projeto no GitHub e hospedar na Netlify, consulte o arquivo:

📖 **[DEPLOY.md](./DEPLOY.md)** - Guia completo de deploy

### Resumo Rápido

1. **GitHub**: Criar repositório e fazer push do código
2. **Render.com**: Deploy do backend (API)
3. **Netlify**: Deploy do frontend (Next.js)

Para mais detalhes, veja o guia completo em `DEPLOY.md`.

---

**Desenvolvido seguindo os padrões estabelecidos**


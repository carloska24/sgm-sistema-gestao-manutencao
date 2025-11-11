# ✅ To-Dos por Sprint - SGM

Este documento contém os to-dos detalhados organizados por sprint para facilitar o acompanhamento do desenvolvimento.

---

## 🏃 SPRINT 1: Autenticação e Base (Semana 1-2)

### Backend
- [x] Implementar endpoint `/api/auth/login` com JWT
- [x] Implementar endpoint `/api/auth/register`
- [x] Implementar endpoint `/api/auth/logout`
- [x] Criar middleware de autenticação JWT
- [x] Criar middleware de autorização por role
- [x] Atualizar tabela `users` com campos necessários
- [x] Implementar hash de senhas com bcrypt
- [x] Validação de dados com Zod

### Frontend
- [x] Criar página de login (`/app/login/page.tsx`)
- [x] Criar hook `useAuth` para gerenciar estado
- [x] Criar Context API para autenticação
- [x] Criar componente `ProtectedRoute` (MainLayout)
- [x] Implementar proteção de rotas
- [x] Criar layout principal com header e sidebar
- [x] Criar componente de navegação
- [x] Implementar sistema de notificações (Toast)

### UX/UI
- [ ] Design da tela de login
- [ ] Design do layout principal
- [ ] Design system básico (cores, tipografia, espaçamentos)
- [ ] Componentes de navegação

### QA
- [ ] Testes de login/logout
- [ ] Testes de autenticação
- [ ] Testes de autorização por role
- [ ] Testes de navegação

---

## 🏃 SPRINT 2: Dashboard e Gestão de Usuários (Semana 2)

### Backend
- [x] Endpoint GET `/api/dashboard/stats`
- [x] Endpoint GET `/api/users` (listagem)
- [x] Endpoint GET `/api/users/:id`
- [x] Endpoint POST `/api/users` (criação)
- [x] Endpoint PUT `/api/users/:id` (atualização)
- [x] Endpoint DELETE `/api/users/:id` (exclusão)
- [x] Validação de dados com Zod

### Frontend
- [x] Página de dashboard (`/app/dashboard/page.tsx`)
- [x] Cards de métricas
- [ ] Gráficos básicos (Chart.js) - Placeholder criado
- [ ] Página de listagem de usuários - Próxima etapa
- [ ] Formulário de criação/edição de usuários - Próxima etapa
- [ ] Modal de confirmação para exclusão - Próxima etapa

### UX/UI
- [ ] Design do dashboard
- [ ] Design das telas de gestão de usuários
- [ ] Componentes de cards e gráficos

### QA
- [ ] Testes do dashboard
- [ ] Testes de CRUD de usuários

---

## 🏃 SPRINT 3: Listagem e Cadastro de Equipamentos (Semana 3)

### Backend
- [x] Atualizar schema do banco com novos campos de equipamentos
- [x] Endpoint GET `/api/equipment` com paginação
- [x] Endpoint GET `/api/equipment` com filtros
- [x] Endpoint GET `/api/equipment/:id`
- [x] Endpoint POST `/api/equipment`
- [x] Validação de código único
- [x] Validação de dados com Zod

### Frontend
- [x] Página de listagem (`/app/equipment/page.tsx`)
- [x] Tabela com TanStack React Table
- [x] Sistema de filtros (nome, código, localização, status, fabricante)
- [x] Busca em tempo real
- [x] Paginação
- [x] Formulário de cadastro (`/app/equipment/new/page.tsx`)
- [x] Validação de formulário

### UX/UI
- [ ] Design da tabela e filtros
- [ ] Design do formulário de cadastro
- [ ] Componentes de input avançados

### QA
- [ ] Testes de listagem e filtros
- [ ] Testes de cadastro e validações

---

## 🏃 SPRINT 4: Detalhes e Edição de Equipamentos (Semana 4)

### Backend
- [x] Endpoint GET `/api/equipment/:id` com relacionamentos
- [x] Endpoint GET `/api/equipment/:id/history` (incluído no GET :id)
- [x] Endpoint PUT `/api/equipment/:id`
- [x] Endpoint DELETE `/api/equipment/:id`
- [ ] Sistema de logs de auditoria (futuro)
- [ ] Cálculo de MTBF e MTTR (futuro - quando houver dados de manutenção)

### Frontend
- [x] Página de detalhes (`/app/equipment/[id]/page.tsx`)
- [x] Tabs para organizar informações
- [x] Visualização de histórico
- [x] Formulário de edição (`/app/equipment/[id]/edit/page.tsx`)
- [x] Confirmação para exclusão
- [x] Exibição de MTBF e MTTR (quando disponível)

### UX/UI
- [ ] Design da página de detalhes
- [ ] Design da timeline de histórico
- [ ] Componentes de tabs

### QA
- [ ] Testes de visualização
- [ ] Testes de edição e exclusão
- [ ] Testes de cálculos (MTBF/MTTR)

---

## 🏃 SPRINT 5: Documentação e Anexos (Semana 5)

### Backend
- [x] Criar tabela `equipment_documents`
- [x] Endpoint POST `/api/equipment/:id/documents`
- [x] Endpoint GET `/api/equipment/:id/documents`
- [x] Endpoint DELETE `/api/equipment/:id/documents/:docId`
- [x] Endpoint GET `/api/equipment/:id/documents/:docId/download`
- [x] Sistema de armazenamento de arquivos (multer)
- [x] Validação de tipos de arquivo

### Frontend
- [x] Componente de upload de documentos
- [x] Visualizador de documentos
- [x] Download de documentos
- [ ] Galeria de imagens (melhoria futura)
- [ ] Preview de PDFs (melhoria futura)

### DevOps
- [ ] Configuração de armazenamento (local ou S3)

### QA
- [ ] Testes de upload e download
- [ ] Testes de validação de arquivos

---

## 🏃 SPRINT 6: Abertura de Chamados (Semana 6)

### Backend
- [ ] Renomear/criar tabela `maintenance_calls`
- [ ] Endpoint POST `/api/calls`
- [ ] Validação de dados
- [ ] Sistema de upload de anexos para chamados

### Frontend
- [ ] Página de abertura (`/app/calls/new/page.tsx`)
- [ ] Formulário multi-step
- [ ] Upload de anexos
- [ ] Preview de imagens
- [ ] Validação de formulário

### UX/UI
- [ ] Design do formulário de abertura
- [ ] Fluxo de múltiplos passos

### QA
- [ ] Testes de abertura de chamados
- [ ] Testes de validação

---

## 🏃 SPRINT 7: Painel de Chamados (Semana 7)

### Backend
- [ ] Endpoint GET `/api/calls` com filtros avançados
- [ ] Filtros por status, prioridade, técnico, período, solicitante
- [ ] Endpoint PUT `/api/calls/:id/assign`
- [ ] Endpoint PUT `/api/calls/:id/priority`
- [ ] Endpoint PUT `/api/calls/:id/status`

### Frontend
- [ ] Página de listagem (`/app/calls/page.tsx`)
- [ ] Tabela com filtros avançados
- [ ] Badges de status com cores
- [ ] Modal de atribuição
- [ ] Seletor de prioridade
- [ ] Sistema de filtros

### UX/UI
- [ ] Design do painel
- [ ] Design dos filtros
- [ ] Componentes de badges

### QA
- [ ] Testes de filtros
- [ ] Testes de atribuição

---

## 🏃 SPRINT 8: Execução de Chamados (Semana 8)

### Backend
- [ ] Endpoint PUT `/api/calls/:id/execute`
- [ ] Endpoint POST `/api/calls/:id/activities`
- [ ] Endpoint GET `/api/calls/:id/history`
- [ ] Cálculo de tempo de execução
- [ ] Sistema de logs automático

### Frontend
- [ ] Página de execução (`/app/calls/[id]/execute/page.tsx`)
- [ ] Formulário de registro de atividades
- [ ] Timer de execução
- [ ] Componente de timeline para histórico
- [ ] Visualização de histórico

### UX/UI
- [ ] Design da interface de execução
- [ ] Design da timeline

### QA
- [ ] Testes de execução
- [ ] Testes de histórico

---

## 🏃 SPRINT 9: Notificações (Semana 9)

### Backend
- [ ] Sistema de envio de emails
- [ ] Fila de emails (opcional)
- [ ] Templates de email
- [ ] Notificações para abertura de chamado
- [ ] Notificações para atribuição
- [ ] Notificações para conclusão

### Frontend
- [ ] Sistema de notificações in-app
- [ ] Badge de notificações
- [ ] Centro de notificações
- [ ] Lista de notificações

### QA
- [ ] Testes de envio de emails
- [ ] Testes de notificações in-app

---

## 🏃 SPRINT 10: Criação de Planos Preventivos (Semana 10)

### Backend
- [ ] Criar tabela `maintenance_plans`
- [ ] Criar tabela `plan_tasks` (checklist)
- [ ] Endpoint POST `/api/plans`
- [ ] Endpoint GET `/api/plans`
- [ ] Endpoint GET `/api/plans/:id`
- [ ] Endpoint PUT `/api/plans/:id`
- [ ] Endpoint DELETE `/api/plans/:id`

### Frontend
- [ ] Página de criação (`/app/plans/new/page.tsx`)
- [ ] Formulário complexo com tabs
- [ ] Gerenciador de checklist
- [ ] Seletor de periodicidade
- [ ] Validação de formulário

### UX/UI
- [ ] Design do formulário de planos
- [ ] Design do gerenciador de checklist

### QA
- [ ] Testes de criação de planos
- [ ] Testes de validação

---

## 🏃 SPRINT 11: Agendamento e Calendário (Semana 11)

### Backend
- [ ] Job scheduler (node-cron)
- [ ] Lógica de geração automática de OS
- [ ] Criar tabela `preventive_orders`
- [ ] Endpoint POST `/api/plans/:id/generate-os`
- [ ] Endpoint GET `/api/preventive/calendar`
- [ ] Endpoint GET `/api/preventive` com filtros

### Frontend
- [ ] Componente de calendário
- [ ] Visualização mensal/semanal
- [ ] Cores por status
- [ ] Visualização de OSs geradas

### DevOps
- [ ] Configuração de jobs agendados

### QA
- [ ] Testes de geração automática
- [ ] Testes de calendário

---

## 🏃 SPRINT 12: Execução de Preventivas (Semana 12)

### Backend
- [ ] Endpoint PUT `/api/preventive/:id/execute`
- [ ] Validação de checklist
- [ ] Cálculo de tempo de execução
- [ ] Endpoint GET `/api/preventive/:id`

### Frontend
- [ ] Página de execução
- [ ] Checklist interativo
- [ ] Formulário de conclusão
- [ ] Validação de checklist completo

### UX/UI
- [ ] Design da interface de execução
- [ ] Design do checklist

### QA
- [ ] Testes de execução
- [ ] Testes de validação de checklist

---

## 🏃 SPRINT 13: Dashboard e KPIs (Semana 13)

### Backend
- [ ] Endpoint GET `/api/dashboard/kpis`
- [ ] Cálculos de métricas (MTBF, MTTR, conformidade)
- [ ] Endpoint GET `/api/dashboard/charts`
- [ ] Endpoints de dados para gráficos

### Frontend
- [ ] Dashboard principal (`/app/dashboard/page.tsx`)
- [ ] Cards de KPI
- [ ] Gráficos (Chart.js)
  - [ ] Pizza (chamados por status)
  - [ ] Linha (chamados por período)
  - [ ] Barra (preventivas concluídas vs atrasadas)
  - [ ] MTBF por equipamento
  - [ ] MTTR por equipamento
- [ ] Filtros de período

### UX/UI
- [ ] Design do dashboard completo
- [ ] Design dos gráficos

### QA
- [ ] Testes de métricas
- [ ] Testes de gráficos

---

## 🏃 SPRINT 14: Relatórios e Exportação (Semana 14)

### Backend
- [ ] Endpoint GET `/api/reports/compliance`
- [ ] Endpoint GET `/api/reports/equipment-history`
- [ ] Endpoint GET `/api/reports/calls-by-status`
- [ ] Endpoint GET `/api/reports/preventive-compliance`
- [ ] Sistema de exportação (PDF, Excel)

### Frontend
- [ ] Página de relatórios (`/app/reports/page.tsx`)
- [ ] Construtor de relatórios
- [ ] Visualização de relatórios
- [ ] Exportação (PDF, Excel)

### QA
- [ ] Testes de relatórios
- [ ] Testes de exportação

---

## 🏃 SPRINT 15: Testes e Otimizações (Semana 15)

### Backend
- [ ] Testes unitários (Jest)
- [ ] Testes de integração
- [ ] Otimização de queries
- [ ] Índices no banco de dados
- [ ] Logs estruturados

### Frontend
- [ ] Testes de componentes (React Testing Library)
- [ ] Testes E2E (Playwright/Cypress)
- [ ] Lazy loading
- [ ] Code splitting
- [ ] Otimização de imagens

### DBA
- [ ] Otimização de banco de dados
- [ ] Criação de índices
- [ ] Análise de performance

### QA
- [ ] Testes de carga
- [ ] Testes de performance
- [ ] Testes de regressão

---

## 🏃 SPRINT 16: Deploy e Produção (Semana 16)

### DevOps
- [ ] Configuração de ambiente de produção
- [ ] Migração para PostgreSQL
- [ ] Configuração de SSL
- [ ] Backup automático
- [ ] Sistema de monitoramento
- [ ] Alertas
- [ ] CI/CD pipeline

### Backend
- [ ] Health checks
- [ ] Métricas de performance
- [ ] Configuração de variáveis de ambiente

### Frontend
- [ ] Build de produção
- [ ] Otimizações finais

### QA
- [ ] Testes em staging
- [ ] Testes finais de aceitação
- [ ] Validação de monitoramento

---

## 📊 Métricas de Acompanhamento

### Por Sprint
- [ ] Velocidade da equipe
- [ ] Taxa de conclusão de tarefas
- [ ] Bugs encontrados
- [ ] Bugs corrigidos
- [ ] Tempo médio de desenvolvimento

### Por Fase
- [ ] Funcionalidades entregues
- [ ] Testes realizados
- [ ] Cobertura de testes
- [ ] Performance
- [ ] Satisfação dos stakeholders

---

**Última atualização:** 11/01/2025  
**Status:** 🟢 Em Planejamento


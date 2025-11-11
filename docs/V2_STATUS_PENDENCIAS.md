# Status de Pendências - SGM V2

**Última atualização:** 12/01/2025

---

## 📊 Resumo Executivo

### ✅ Implementado
- **Épico 1 (Layout V2)**: ~80% completo
- **Épico 2 (Offline/PWA)**: ~90% completo (teste pendente)
- **Épico 3 (Checklists)**: ~70% completo
- **Épico 4 (Materiais)**: ~60% completo

### ⚠️ Pendências Críticas
1. Testes de modo offline (deixado para último conforme solicitado)
2. Builder de checklists completo
3. Integração completa de materiais com estoque
4. Ajustes finais de layout em todas as páginas principais

---

## Épico 1 – Navegação e Layout Inteligentes

### ✅ Concluído
- [x] **HIST-001**: Contexto de layout com feature flag `NEXT_PUBLIC_ENABLE_LAYOUT_V2`
- [x] **HIST-002**: Sidebar retrátil (expandido/compacto) em desktop
- [x] **HIST-003**: Modo overlay mobile/tablet
- [x] **HIST-004**: Header V2 com controles (hambúrguer, notificações placeholder, full screen)
- [x] Componentes base: `LayoutShell`, `SidebarV2`, `HeaderV2`
- [x] `LayoutContext` com persistência em `localStorage`
- [x] Indicador de fila offline no header

### ⚠️ Pendente
- [ ] **HIST-005**: Adaptar TODAS as páginas principais ao novo layout
  - [ ] Dashboard (`/app/dashboard/page.tsx`) - Verificar se está usando layout fluido
  - [ ] Equipamentos (`/app/equipment/page.tsx`) - Verificar Grid/Kanban
  - [ ] Chamados (`/app/calls/page.tsx`) - Verificar se está responsivo
  - [ ] Preventivas (`/app/plans/page.tsx`) - Verificar layout
  - [ ] Relatórios (`/app/reports/page.tsx`) - Verificar se está usando full screen
  - [ ] Usuários (`/app/users/page.tsx`) - Verificar layout
- [ ] **HIST-006**: Modo full screen nas páginas Kanban/Grid
  - [ ] Implementar botão full screen nas páginas de listagem
  - [ ] Garantir que `Esc` sai do modo full screen
  - [ ] Persistir preferência de full screen

### 📝 Observações
- Layout V2 está funcional mas precisa ser aplicado consistentemente em todas as páginas
- Verificar se há dependências de largura fixa que precisam ser removidas

---

## Épico 2 – Mobilidade & Operação Offline (PWA)

### ✅ Concluído
- [x] **HIST-101**: Service worker configurado (`public/service-worker.js`)
- [x] **HIST-102**: Estratégia de cache IndexedDB implementada (`lib/offline/indexedDb.ts`)
- [x] **HIST-103**: Fila de sincronização implementada (`lib/offline/offlineManager.ts`)
- [x] **HIST-104**: Indicador de status offline/online (`OfflineQueueIndicator`)
- [x] **HIST-105**: Resolução de conflitos (`OfflineConflictBanner`, `resolveConflict`)
- [x] Cache de ordens, chamados, checklists e materiais
- [x] Enfileiramento de atualizações offline
- [x] Sincronização automática ao reconectar
- [x] Feedback visual em tempo real da fila
- [x] Página offline (`/app/offline/page.tsx`)
- [x] Manifest PWA (`app/manifest.ts`)
- [x] `OfflineSyncProvider` para inicialização

### ⚠️ Pendente
- [ ] **TESTES**: Testar modo offline completamente (deixado para último)
  - [ ] Testar salvamento offline de OS
  - [ ] Testar salvamento offline de chamados
  - [ ] Testar salvamento offline de checklists
  - [ ] Testar salvamento offline de materiais
  - [ ] Testar sincronização ao reconectar
  - [ ] Testar resolução de conflitos
  - [ ] Testar em diferentes navegadores
  - [ ] Testar em dispositivos móveis reais

### 📝 Observações
- Funcionalidade offline está implementada mas não testada em produção
- Aguardar deploy no Netlify para testes completos

---

## Épico 3 – Checklists Inteligentes & Segurança Operacional

### ✅ Concluído
- [x] **HIST-201**: Modelo de dados criado (`V2_CHECKLISTS_SCHEMA.md`)
- [x] Backend: Rotas de checklists (`backend/routes/checklists.js`)
  - [x] CRUD de templates
  - [x] Endpoint de respostas
- [x] Frontend: Página de gestão (`app/checklists/page.tsx`)
- [x] Frontend: Componente de execução (`components/maintenance/ChecklistExecutionPanel.tsx`)
- [x] **HIST-204**: Registro de EPIs/segurança obrigatório antes de iniciar execução
  - [x] Modal de segurança em OS (`app/maintenance/[id]/page.tsx`)
  - [x] Modal de segurança em chamados (`app/calls/[id]/page.tsx`)
  - [x] Checklist de procedimentos de segurança
  - [x] Validação obrigatória antes de iniciar/retomar
- [x] Integração offline de checklists
- [x] Cache de templates e respostas

### ⚠️ Pendente
- [ ] **HIST-202**: Builder de checklist completo no painel de plano preventivo
  - [ ] Interface para criar templates diretamente no plano
  - [ ] Drag-and-drop para ordenar itens
  - [ ] Configuração de tipos de input (boolean, number, text, multi)
  - [ ] Configuração de requisitos (foto, assinatura)
- [ ] **HIST-203**: Execução de checklist aprimorada
  - [ ] Upload de evidências por item (fotos)
  - [ ] Assinatura digital por item
  - [ ] Validação de itens obrigatórios
  - [ ] Preview de instruções detalhadas
- [ ] **HIST-205**: Upload de evidências por item de checklist
  - [ ] Integração com MinIO/S3 para armazenamento
  - [ ] Preview de fotos no checklist
  - [ ] Galeria de evidências

### 📝 Observações
- Sistema básico de checklists está funcional
- Builder precisa ser mais completo e integrado aos planos preventivos
- Upload de evidências precisa ser implementado

---

## Épico 4 – Materiais, Peças e Integração com Estoque

### ✅ Concluído
- [x] **HIST-303**: Integração de `parts_used` com seleção estruturada
  - [x] Modal de materiais em OS (`app/maintenance/[id]/page.tsx`)
  - [x] Modal de materiais em chamados (`app/calls/[id]/page.tsx`)
  - [x] Input estruturado (nome, quantidade, unidade, valor)
  - [x] Armazenamento em JSON
  - [x] Cálculo de valor total
  - [x] Integração offline
- [x] Visualização de materiais utilizados em formato estruturado

### ⚠️ Pendente
- [ ] **HIST-301**: Definir schema completo de itens de estoque e locais
  - [ ] Criar tabela `inventory_items` (SKU, nome, descrição, unidade, custo, estoque mínimo)
  - [ ] Criar tabela `inventory_locations` (localização física)
  - [ ] Criar tabela `inventory_movements` (entrada/saída)
- [ ] **HIST-302**: UI para cadastro e inventário básico
  - [ ] Página de listagem de itens (`/app/inventory/page.tsx`)
  - [ ] Formulário de cadastro de itens
  - [ ] Visualização de estoque atual
  - [ ] Histórico de movimentações
- [ ] **HIST-304**: Gerar movimentação de estoque ao concluir OS
  - [ ] Baixa automática ao concluir OS/chamado
  - [ ] Validação de estoque disponível
  - [ ] Alertas de estoque mínimo
- [ ] **HIST-305**: Relatório de consumo por equipamento/período
  - [ ] Endpoint de relatório de consumo
  - [ ] Visualização gráfica de consumo
  - [ ] Exportação de dados

### 📝 Observações
- Sistema básico de registro de materiais está funcional
- Falta integração completa com controle de estoque
- Necessário criar módulo completo de inventário

---

## Épico 5 – Comunicação & Notificações

### ⚠️ Pendente (Não iniciado)
- [ ] **HIST-401**: Configurar serviço de WebSocket (Socket.IO) e autenticação
- [ ] **HIST-402**: Chat contextual em chamados
- [ ] **HIST-403**: Notificações push web para eventos críticos
- [ ] **HIST-404**: Painel de atividades recentes

### 📝 Observações
- Épico não iniciado
- Depende de conclusão dos épicos anteriores

---

## Épico 6 – Integrações & Automação

### ⚠️ Pendente (Não iniciado)
- [ ] **HIST-501**: Design da API externa (webhooks, endpoints de criação de chamados)
- [ ] **HIST-502**: Implementar ingestão de alertas externos e criação automática de OS/chamados
- [ ] **HIST-503**: Interface de configuração de regras (gatilhos)

### 📝 Observações
- Épico não iniciado
- Depende de conclusão dos épicos anteriores

---

## Épico 7 – Analytics & Treinamento

### ⚠️ Pendente (Não iniciado)
- [ ] **HIST-601**: Dashboards personalizáveis (seleção de widgets)
- [ ] **HIST-602**: Exportação CSV/PDF das principais visões
- [ ] **HIST-603**: Módulo de lições aprendidas ligado a planos/chamados
- [ ] **HIST-604**: Microlearning (anexos de treinamento) exibidos antes da execução

### 📝 Observações
- Épico não iniciado
- Depende de conclusão dos épicos anteriores

---

## Infraestrutura e Suporte

### ✅ Concluído
- [x] Documentação de migração técnica (`V2_MIGRACAO_TECNICA.md`)
- [x] Configuração Docker Compose para PostgreSQL e MinIO
- [x] Atualização de `env.example` com variáveis PostgreSQL
- [x] Suporte dual SQLite/PostgreSQL no `database.js`

### ⚠️ Pendente
- [ ] **INF-001**: Provisionar banco Postgres e storage S3/MinIO em produção
- [ ] **INF-002**: Migrar dados SQLite → Postgres
- [ ] **INF-003**: Configurar CI/CD e pipelines automáticos
- [ ] **INF-004**: Implementar monitoramento/logs centralizados

### 📝 Observações
- Infraestrutura está preparada para migração mas não executada
- Aguardar decisão sobre ambiente de produção

---

## Prioridades Recomendadas

### 🔴 Alta Prioridade (Próximas ações)
1. **Adaptar todas as páginas ao Layout V2** (HIST-005)
   - Impacto: Alto (UX consistente)
   - Esforço: Médio
   - Dependências: Nenhuma

2. **Implementar modo full screen** (HIST-006)
   - Impacto: Médio (melhora experiência Kanban/Grid)
   - Esforço: Baixo
   - Dependências: Layout V2 completo

3. **Completar builder de checklists** (HIST-202)
   - Impacto: Alto (funcionalidade core)
   - Esforço: Médio
   - Dependências: Nenhuma

### 🟡 Média Prioridade
4. **Módulo completo de inventário** (HIST-301, HIST-302)
   - Impacto: Alto (controle de estoque)
   - Esforço: Alto
   - Dependências: Nenhuma

5. **Upload de evidências em checklists** (HIST-205)
   - Impacto: Médio (completude de funcionalidade)
   - Esforço: Médio
   - Dependências: MinIO/S3 configurado

### 🟢 Baixa Prioridade (Futuro)
6. **Comunicação em tempo real** (Épico 5)
7. **Integrações externas** (Épico 6)
8. **Analytics avançados** (Épico 7)

---

## Checklist de Validação Final

### Antes de considerar V2 completa:
- [ ] Todas as páginas principais adaptadas ao Layout V2
- [ ] Modo full screen funcionando em Kanban/Grid
- [ ] Testes offline completos realizados
- [ ] Builder de checklists completo e funcional
- [ ] Upload de evidências funcionando
- [ ] Módulo de inventário básico implementado
- [ ] Documentação atualizada
- [ ] Testes de regressão realizados
- [ ] Performance validada

---

**Próxima revisão:** Após testes offline no Netlify


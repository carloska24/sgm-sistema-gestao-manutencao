# Backlog Inicial – SGM V2

Este backlog organiza histórias iniciais por épico para alimentar o board de desenvolvimento. Cada item inclui descrição, critérios de aceitação e dependências.

## Épico 1 – Navegação e Layout Inteligentes
1. **HIST-001**: Criar contexto de layout com feature flag `enableLayoutV2`.
   - *Critérios*: flag global; toggle via `.env`; revertível.
2. **HIST-002**: Implementar sidebar retrátil (expandido/compacto) em desktop.
   - *Critérios*: animação suave; persistência em `localStorage`; acessível via botão.
3. **HIST-003**: Implementar modo overlay mobile/tablet.
   - *Critérios*: abre sobre conteúdo; fecha ao selecionar item; backdrop.
4. **HIST-004**: Ajustar header com novos controles (hambúrguer, notificações placeholder, full screen).
   - *Critérios*: layout responsivo; foco acessível; modo full screen ativável.
5. **HIST-005**: Adaptar páginas principais (Dashboard, Equipamentos, Chamados, Preventivas) ao novo layout.
   - *Critérios*: remover dependências de largura fixa; garantir scroll adequado.
6. **HIST-006**: Implementar modo full screen nas páginas Kanban/Grid.
   - *Critérios*: botão visível; `Esc` sai; preferências persistem.

## Épico 2 – Mobilidade & Offline
1. **HIST-101**: Configurar service worker com cache estático básico.
   - *Critérios*: app instala como PWA; assets principais em cache.
2. **HIST-102**: Definir estratégia de cache de dados (IndexedDB) para OS e chamados.
   - *Critérios*: schema documentado; camada de acesso abstrata.
3. **HIST-103**: Implementar fila de sincronização (criação/edição offline).
   - *Critérios*: ações persistem offline; sincronizam ao reconectar; feedback visual.
4. **HIST-104**: Indicador de status offline/online no header.
5. **HIST-105**: Resolver conflitos de edição (última versão vs offline).

## Épico 3 – Checklists Inteligentes
1. **HIST-201**: Criar modelo de dados para checklists (Planos/Chamados).
2. **HIST-202**: Builder de checklist no painel de plano preventivo.
3. **HIST-203**: Execução de checklist no app móvel com marcação passo a passo.
4. **HIST-204**: Registro de EPIs/segurança obrigatório antes de iniciar execução.
5. **HIST-205**: Upload de evidências por item de checklist.

## Épico 4 – Materiais/Estoque
1. **HIST-301**: Definir schema de itens de estoque e locais.
2. **HIST-302**: UI para cadastro e inventário básico.
3. **HIST-303**: Integrar `parts_used` com seleção de itens/quantidades.
4. **HIST-304**: Gerar movimentação de estoque ao concluir OS.
5. **HIST-305**: Relatório de consumo por equipamento/período.

## Épico 5 – Comunicação & Notificações
1. **HIST-401**: Configurar serviço de WebSocket (Socket.IO) e autenticação.
2. **HIST-402**: Chat contextual em chamados.
3. **HIST-403**: Notificações push web para eventos críticos (novo chamado, atribuição, atraso).
4. **HIST-404**: Painel de atividades recentes.

## Épico 6 – Integrações & Automação
1. **HIST-501**: Design da API externa (webhooks, endpoints de criação de chamados).
2. **HIST-502**: Implementar ingestão de alertas externos e criação automática de OS/chamados.
3. **HIST-503**: Interface de configuração de regras (gatilhos).

## Épico 7 – Analytics & Treinamento
1. **HIST-601**: Dashboards personalizáveis (seleção de widgets).
2. **HIST-602**: Exportação CSV/PDF das principais visões.
3. **HIST-603**: Módulo de lições aprendidas ligado a planos/chamados.
4. **HIST-604**: Microlearning (anexos de treinamento) exibidos antes da execução.

## Infraestruturas e Suporte (ligadas à migração técnica)
1. **INF-001**: Provisionar banco Postgres e storage S3.
2. **INF-002**: Migrar dados SQLite → Postgres (vide `V2_MIGRACAO_TECNICA.md`).
3. **INF-003**: Configurar CI/CD e pipelines automáticos.
4. **INF-004**: Implementar monitoramento/logs centralizados.

## Notas Gerais
- Ordenar histórias dentro de cada épico conforme prioridade e dependência técnica.
- Estimar pontos de história junto ao time (planning poker).
- Manter este backlog atualizado no board oficial (Jira/Notion) com status.

---
*Documento vivo. Atualizar conforme feedback e novas descobertas.*

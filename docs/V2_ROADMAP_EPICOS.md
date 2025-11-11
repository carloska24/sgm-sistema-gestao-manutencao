# Roadmap de Épicos – SGM V2

## Visão Geral
Este roadmap organiza as iniciativas da V2 em épicos com objetivos, entregáveis, dependências e métricas de sucesso. Serve como guia para planejamento de sprints e acompanhamento conjunto UX/Dev/Operações.

---

## Épico 1 – Navegação e Layout Inteligentes
- **Objetivo**: liberar área útil, garantir responsividade e base para features futuras.
- **Entregáveis**:
  - Sidebar retrátil + overlay (conforme `V2_LAYOUT_NAVIGACAO.md`).
  - Header com novos controles e full screen.
  - Ajustes nas páginas principais (Dashboard, Equipamentos, Chamados, Preventivas, Relatórios, Usuários).
- **Dependências**: wireframes UX, POC layout, feature flag.
- **Indicadores**: feedback positivo dos técnicos sobre espaço útil; aumento de 20% na largura útil do Kanban.
- **ETA**: Sprint 1-2.

## Épico 2 – Mobilidade & Operação Offline (PWA)
- **Objetivo**: permitir uso em campo com conexão intermitente.
- **Entregáveis**:
  - Service worker com cache de dados críticos (OS, chamados, planos, equipamentos).
  - Sincronização offline/online com fila de ações.
  - Modo offline com indicador visual e prevenção de conflitos.
- **Dependências**: Layout V2, definição de dados prioritários.
- **Indicadores**: redução de falhas de registro em campo; relatórios de uso offline.
- **ETA**: Sprint 3-5.

## Épico 3 – Checklists Inteligentes & Segurança Operacional
- **Objetivo**: estruturar execução de preventivas/corretivas com passo a passo.
- **Entregáveis**:
  - Builder de checklists (associado a planos e chamados).
  - Registro de EPIs, bloqueios, assinaturas digitais.
  - Upload de evidências (fotos/vídeos) direto no checklist.
  - Templates reutilizáveis por tipo de equipamento.
- **Dependências**: UX definir fluxos e componentes; mobilidade/PWA.
- **Indicadores**: % de OS com checklist completo; redução de falhas por não conformidade.
- **ETA**: Sprint 5-7.

## Épico 4 – Materiais, Peças e Integração com Estoque
- **Objetivo**: controlar uso de peças/insumos e reduzir deslocamentos improdutivos.
- **Entregáveis**:
  - Cadastro de itens (SKU, estoque, localização, custo).
  - Reserva e baixa automática via `parts_used` estruturado.
  - Integração futura com ERP/almoxarifado (API ou importação CSV).
  - Relatórios de consumo por equipamento/OS.
- **Dependências**: base de dados escalável (considerar migração para Postgres).
- **Indicadores**: redução de chamados reabertos por falta de peças; visibilidade de estoque crítico.
- **ETA**: Sprint 7-9.

## Épico 5 – Comunicação em Tempo Real & Notificações
- **Objetivo**: aproximar técnicos e supervisores, agilizando resolução.
- **Entregáveis**:
  - Chat/contexto em OS e chamados.
  - Notificações push (web + mobile) para urgências, atrasos, novas atribuições.
  - Painel de atividades recentes (timeline).
- **Dependências**: Layout V2 (drawer), autenticação estável, PWA.
- **Indicadores**: tempo de resposta entre abertura e primeira ação; feedback positivo dos técnicos.
- **ETA**: Sprint 9-11.

## Épico 6 – Integrações e Automação
- **Objetivo**: conectar sensores, sistemas externos e disparar ações automáticas.
- **Entregáveis**:
  - API/webhooks para recepção de alertas (IoT/SCADA).
  - Motor de regras para gerar OS/chamados com base em métricas.
  - Documentação e exemplos de integração.
- **Dependências**: épicos anteriores concluídos ou estáveis.
- **Indicadores**: número de alertas automáticos gerados; redução de paradas não planejadas.
- **ETA**: Sprint 11-14.

## Épico 7 – Analytics Avançados & Treinamento
- **Objetivo**: dar visibilidade holística e promover lições aprendidas.
- **Entregáveis**:
  - Dashboards configuráveis por usuário.
  - Exportação de relatórios (PDF/Excel).
  - Módulo de lições aprendidas e microlearning ligado a planos.
- **Dependências**: coleta estruturada de dados (checklists, materiais, chat).
- **Indicadores**: uso dos relatórios; aumento de entregas dentro do SLA.
- **ETA**: Sprint 14-16.

---

## Marcos Estratégicos
1. **M1 – Layout V2 em Produção (épico 1)**
2. **M2 – Uso offline validado com pilotos (épico 2)**
3. **M3 – Checklists e materiais adotados pela equipe (épicos 3 e 4)**
4. **M4 – Comunicação em produção com alertas push (épico 5)**
5. **M5 – Integrações/automação operacionais (épico 6)**
6. **M6 – Dashboards avançados e treinamento disponíveis (épico 7)**

## Considerações
- Estimativas de sprint são sequenciais e podem rodar parcialmente em paralelo dependendo do time.
- Recomenda-se revisões trimestrais do roadmap com dados reais de uso.
- Ajustes de stack (ex.: migração para Postgres) devem ocorrer antes ou durante épicos 3-4.

---
*Documento vivo. Atualizações conforme prioridades do negócio e feedback do campo.*

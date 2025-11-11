# Cronograma de Execução – SGM V2

## Estrutura de Sprints
- Duração padrão: 2 semanas
- Cerimônias: planning (dia 1), daily stand-up, review & retro (final da sprint)
- Times envolvidos: Produto, UX, Frontend, Backend, DevOps, QA, Campo

## Visão Geral (16 semanas – 8 sprints)
| Sprint | Período | Foco Principal | Entregáveis Chave | Responsáveis Líderes |
| --- | --- | --- | --- | --- |
| Sprint 1 | Semanas 1-2 | Navegação V2 – discovery e POC | Wireframes base, feature flag layout, sidebar retrátil prototipada | UX Lead, Front Lead |
| Sprint 2 | Semanas 3-4 | Layout completo + header/full screen | Implementação layout V2 nas principais páginas, teste piloto interno | Front Lead, QA |
| Sprint 3 | Semanas 5-6 | PWA – fundamentos offline | Service worker básico, cache estático, UX mobile refinado | Front Lead, UX |
| Sprint 4 | Semanas 7-8 | PWA – sincronização + Postgres | IndexedDB/fila offline, migração banco em staging | Backend Lead, DevOps |
| Sprint 5 | Semanas 9-10 | Checklists & Segurança | Builder, execução passo a passo, EPIs | Backend Lead, UX |
| Sprint 6 | Semanas 11-12 | Materiais & Estoque | Cadastro, consumo automático, relatórios iniciais | Backend Lead, Produto |
| Sprint 7 | Semanas 13-14 | Comunicação & Notificações | Chat em chamados, push web/mobile, timeline | Front Lead, Backend Lead |
| Sprint 8 | Semanas 15-16 | Integrações & Analytics | API externa, dashboards personalizáveis, lições aprendidas | DevOps, Produto |

## Detalhamento por Sprint
### Sprint 1 – Kickoff V2
- **Backlog**: HIST-001 a HIST-004, INF-001 planejamento
- **Atividades UX**: jornadas, wireframes navegação
- **Atividades Dev**: feature flag, contexto layout, sidebar protótipo
- **Checkpoints**: review com técnicos sobre wireframes

### Sprint 2 – Layout Consolidado
- **Backlog**: HIST-005, HIST-006, ajustes header; testes responsivos
- **QA**: testes manuais em resoluções diversas
- **Deliverable**: Layout V2 habilitado em ambiente staging

### Sprint 3 – PWA Fundamentos
- **Backlog**: HIST-101, HIST-102, UX mobile hi-fi
- **QA**: testes de instalação PWA
- **Check**: relatório de compatibilidade dispositivos (Android/iOS)

### Sprint 4 – Sincronização Offline + Migração Banco
- **Backlog**: HIST-103, HIST-104, INF-002, INF-003 (início)
- **DevOps**: provisionar Postgres, pipelines
- **QA**: testes offline/online, validação migração em staging

### Sprint 5 – Checklists Inteligentes
- **Backlog**: HIST-201 a HIST-205
- **UX**: protótipos checklist, microinterações
- **Campo**: teste piloto com equipe em planta selecionada

### Sprint 6 – Materiais & Estoque
- **Backlog**: HIST-301 a HIST-305
- **DevOps**: monitoramento de performance Postgres
- **Relatório**: consumo de materiais com dados fictícios + feedback usuários

### Sprint 7 – Comunicação & Notificações
- **Backlog**: HIST-401 a HIST-404
- **Infra**: configurar WebSocket + push (Firebase/OneSignal)
- **QA**: testes de carga leves para chat

### Sprint 8 – Integrações & Analytics
- **Backlog**: HIST-501 a HIST-604, INF-004
- **Entrega final**: API documentada, dashboards personalizáveis, lições aprendidas
- **Release**: revisão geral para lançamento V2

## Marcos de Governança
- **Go/No-Go** ao final das sprints 2, 4, 6 e 8
- Reuniões com diretoria/manutenção a cada 4 semanas
- Comitê de mudança (Gerente, Prod Owner, Tech Lead) decide ativações em produção

## Riscos & Planos de Contingência
- Atraso UX → priorizar componentes críticos first, uso de placeholders
- Migração banco falha → janelas de rollback definidas, backups automáticos
- Treinamento insuficiente → planejar sessões pré release V2
- Excesso escopo épicos → manter backlog controlado, reavaliar em reviews

## Planejamento de Treinamento
- **Semana 14**: material de onboarding para técnicos (vídeo, manual)
- **Semana 15**: workshops com supervisores
- **Semana 16**: suporte dedicado pós-go live (sala de guerra virtual)

## Documentos Relacionados
- `V2_PLANEJAMENTO.md`
- `V2_LAYOUT_NAVIGACAO.md`
- `V2_ROADMAP_EPICOS.md`
- `V2_MIGRACAO_TECNICA.md`
- `V2_BACKLOG_INICIAL.md`
- `V2_UX_BRIEFING.md`

---
*Atualize conforme ajustes de escopo ou mudanças na velocidade do time.*

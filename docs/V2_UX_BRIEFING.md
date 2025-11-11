# Briefing UX – SGM V2

## 1. Objetivo
Fornecer à equipe de UX informações e direcionamentos necessários para projetar a experiência da V2, alinhada às necessidades dos técnicos de campo e aos objetivos de negócio.

## 2. Contexto
- Sistema atual possui menu lateral fixo que reduz a área útil de Kanban/Grid e não atende bem a dispositivos móveis.
- Técnicos em campo precisam de uma interface leve, responsiva e funcional offline.
- Novas funcionalidades (checklists, chat, materiais) exigem componentes atualizados e coerentes com a identidade visual.

## 3. Principais Problemas a Resolver
1. **Espaço útil**: garantir visão ampla de Kanban, grids e formulários sem obstruções.
2. **Responsividade**: adaptar-se a tablets e smartphones usados em campo.
3. **Fluxos guiados**: orientar técnicos com checklists, alertas de segurança e registros de materiais.
4. **Comunicação**: permitir troca de mensagens e anexos em tempo real.
5. **Consistência visual**: evolução do design mantendo identidade SGM.

## 4. Entregáveis UX
| Etapa | Entregável | Detalhes | Prazo estimado |
| --- | --- | --- | --- |
| Discovery | Mapa de jornadas (técnico, gerente) | Identificar pontos de dor atuais e oportunidades |
| IA/Layout | Wireframes de navegação V2 | Sidebar retrátil, header, modo full screen | Semana 2 |
| IA/Fluxos | Wireframes de páginas principais (grid, kanban, detalhe OS, checklist, chat) | Incluir estados vazio/erro/offline | Semana 3 |
| Visual | Protótipo high-fidelity (desktop + tablet/mobile) | Base no design system atual, com ajustes | Semana 4 |
| Interação | Protótipo navegável (Figma) | Demonstra transições, overlays e drawers | Semana 4 |
| Design System | Atualização de componentes | Botões, badges, cards, checklists, inputs; tokens de spacing | Semana 5 |
| Handoff | Especificações e assets | Documentação, exportação de ícones, estilos | Semana 5 |

## 5. Requisitos de Design
- Manter paleta dark/verde; explorar variações que melhorem contraste e legibilidade.
- Definir escalas de spacing responsivas (rem).
- Documentar variantes de componentes (estados hover, disabled, loading, sucesso/erro).
- Considerar acessibilidade (WCAG 2.1 AA): contraste mínimo, navegação por teclado, area focus.
- Aplicar microinterações sutis (hover, feedback visual de ações, animações de exp/contração).

## 6. Pesquisas e Validações
- **Entrevistas rápidas** com técnicos (10-15 min) focando em uso diário.
- **Teste de usabilidade** com protótipo (pelo menos 3 participantes – técnico, gerente, solicitante).
- **Pesquisa de campo**: observação do ambiente de trabalho (verificar equipamentos, iluminação, tempo disponível para interação com o sistema).

## 7. Colaboração
- Ferramenta sugerida: **Figma** (projetos separados: Wireframe, UI, Prototype).
- Comunicação diária via Slack/Teams com canal dedicado `#sgm-v2-ux`.
- Reuniões semanais de alinhamento triad (Produto + UX + Dev) para revisar entregas.
- Utilizar o board `V2_BACKLOG_INICIAL.md` como referência para priorizar telas.

## 8. Métricas UX
- Tempo médio para localizar informação crítica (ex.: status de OS) deve cair >30%.
- Satisfação dos técnicos (NPS interno) acima de 8/10 após uso do protótipo.
- Taxa de conclusão de checklists completa >90% nas preventivas.
- Redução de tickets de suporte referentes a navegação/interface.

## 9. Próximas Ações para UX
1. Revisar `docs/V2_LAYOUT_NAVIGACAO.md` e `docs/V2_ROADMAP_EPICOS.md` para completo entendimento.
2. Construir mapa de jornada dos técnicos (AS-IS e TO-BE).
3. Entregar wireframes de navegação até o final da segunda semana.
4. Validar protótipo junto ao time de campo antes da sprint de desenvolvimento correspondente.

---
*Documento de alinhamento inicial. Atualize conforme surgirem novos insights de pesquisa ou mudanças de escopo.*

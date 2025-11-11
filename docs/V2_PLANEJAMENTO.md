# Planejamento Inicial SGM V2

## 1. Contexto
- **Objetivo geral**: Evoluir o SGM incorporando funcionalidades orientadas ao trabalho de campo (offline, checklists, comunicação) e ampliar o espaço útil das telas por meio de uma nova navegação adaptável.
- **Situação atual**: Navegação fixa lateral reduz a área de Kanban/Grid; fluxo mobile é limitado; dados críticos (materiais, checklists) são pouco estruturados.
- **Stakeholders principais**:
  - Gerente de Manutenção
  - Técnicos de campo (preventiva/corretiva)
  - Operadores/Solicitantes de chamados
  - Equipe de UX/UI
  - Equipe de TI/DevOps

## 2. Briefing UX
### 2.1 Personas-chave
| Persona | Necessidades | Dor atual |
| --- | --- | --- |
| **Técnico de campo** | Acessar OS/chamados rapidamente, atualizar status mesmo sem internet, seguir checklists e registrar evidências. | Tela apertada no Kanban, ausência de modo offline, poucos guias visuais.
| **Gerente de manutenção** | Visualizar priorização, acompanhar execução, assegurar padronização. | Falta de indicadores em tempo real para cada técnico, checklists pouco estruturados.
| **Solicitante/Operador** | Abrir chamados com detalhes, acompanhar status. | Campos pouco guiados e feedback restrito.

### 2.2 Objetivos UX
- Aumentar o **espaço útil** das áreas de trabalho (Kanban/Grid) com navegação retrátil/overlay.
- Entregar experiência **mobile-first/PWA** com sincronização offline.
- Fornecer **checklists interativos** e orientações visuais (fotos, vídeos, POPs) diretamente na OS.
- Simplificar comunicação entre campo e base (chat, comentários em tempo real).
- Garantir fluxo consistente para registro de materiais, segurança e lições aprendidas.

### 2.3 Princípios de Design
1. **Academia visual do SGM**: manter paleta dark + destaque verde, porém com componentes responsivos.
2. **Modularidade**: layouts em cards/colunas ajustáveis, sem dependência da sidebar fixa.
3. **Foco no contexto**: cada tela exibir apenas dados necessários à tarefa corrente.
4. **Gestos simples**: no mobile, preferir ações de swipe, botões grandes e atalhos claros.
5. **Feedback imediato**: toda ação gera confirmação (toast, badge, update em tempo real).
6. **Acessibilidade**: contraste adequado, navegação via teclado, suporte a screen readers.

### 2.4 Entregáveis UX (fase discovery)
- Wireframes navegáveis para: Dashboard, Equipamentos (Grid/Kanban), Chamados, Preventivas, Relatórios, Usuários.
- Protótipo de navegação com **sidebar retrátil** + menu overlay (mobile).
- Guia de componentes: cards, modais, checklists, chat drawer, badges de status.

## 3. Inventário de Telas e Impactos
| Módulo | Situação atual | Ações V2 |
| --- | --- | --- |
| Dashboard | Cards + gráficos fixos | Ajustar para layout fluido, cards rearranjáveis, modo full screen.
| Equipamentos | Grid/Kanban, menu fixo | Implementar layout sem sidebar fixa, adicionar filtros avançados e checklist.
| Chamados | Lista + detalhe | Criar visão Kanban por status, chat embutido, campos estruturados por equipamento.
| Preventivas/Planos | Lista + calendário | Checklists interativos, ordens com instruções passo a passo.
| Manutenção (OS) | Detalhe | Layout responsivo mobile, confirmação de segurança e materiais.
| Relatórios | Gráficos estáticos | Dashboards dinâmicos, modo exportação.
| Usuários | Gestão simples | Fluxo aprimorado para papéis, onboarding e assinatura digital.

## 4. Roadmap Funcional V2 (macro)
1. **Base de Navegação & Layout**
   - Sidebar retrátil + overlay mobile
   - Header com atalhos, notificações, modo full screen
   - Persistência de preferências de layout

2. **Mobilidade & Offline (PWA)**
   - Service worker, cache de dados críticos
   - Queue de sincronização para updates offline
   - Controle de conflitos (ultima edição x atual)

3. **Checklists Inteligentes & Segurança**
   - Builder de checklist por plano/equipamento
   - Registro de EPIs, bloqueios, assinaturas digitais
   - Evidências fotográficas in-app

4. **Materiais e Estoque**
   - Cadastro de peças/insumos
   - Reserva/baixa automática ao registrar `parts_used`
   - Integração futura com ERP (API)

5. **Comunicação & Notificações**
   - Chat/bate-papo contextual por OS/chamado
   - Push notifications (web/mobile) para urgências, atrasos
   - Timeline consolidada

6. **Integrações Externas & Automação**
   - Webhooks/API para sensores e SCADA
   - Regras de gatilho (ex.: gerar OS quando metragem excede limite)

7. **Analytics & Treinamento**
   - Dashboards personalizáveis
   - Módulo de lições aprendidas e microlearning
   - Exportação de relatórios e indicadores por técnico/equipamento

## 5. Cronograma Inicial (estimativa)
| Semana | Atividade | Responsável |
| --- | --- | --- |
| 1 | Discovery/briefing com UX, validação de dores | UX + Produto + Campo |
| 2 | Wireframes navegação + layout | UX |
| 3 | POC técnico do novo layout (feature flag) | Dev Front |
| 4-5 | Especificação detalhada checklists/materiais | Produto + UX + Campo |
| 6+ | Sprints contínuos por épico | Dev + QA + UX |

## 6. Próximos Passos Imediatos
1. Agendar workshop com UX e representantes de campo.
2. Levantar métricas de uso das telas atuais (heatmaps, analytics se disponíveis).
3. Definir ferramenta de prototipação (Figma) e board de acompanhamento (Jira/Notion).
4. Criar branch/projeto `sgm-v2` com feature toggles para testes paralelos.

## 7. Documentos Relacionados
- `docs/ESTRUTURA_PROJETO_SGM.md`: referência completa da V1.
- `docs/V2_PLANEJAMENTO.md` (este arquivo): planejamento inicial.
- Próximos documentos a produzir:
  - Guia de Design System V2
  - Roadmap detalhado com entregas/sprints
  - Plano de migração de dados e infraestrutura

---
*Este documento será atualizado conforme avançarmos nas etapas de discovery, prototipação e implementação.*

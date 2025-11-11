# Especificação de Navegação e Layout – SGM V2

## 1. Objetivo
Definir comportamento e requisitos da nova experiência de navegação V2, priorizando ganho de área útil para Kanban/Grid e alinhando a interface a um fluxo mobile-first.

## 2. Componentes Principais

### 2.1 Sidebar Inteligente
- **Modos**:
  1. **Expandido (padrão desktop)**: largura ~240px, exibe ícone + label. Fixa quando usuário prefere foco em navegação.
  2. **Compacto**: largura ~72px, apenas ícones. Tooltips ao hover. Mantém espaço livre no conteúdo.
  3. **Overlay (mobile/tablet ou quando solicitado)**: abre sobre o conteúdo ocupando 80% da largura, com backdrop semitransparente.
- **Persistência**: estado do modo salvo em `localStorage` e sincronizado com contexto React.
- **Animação**: transição suave (200ms) ao expandir/contrair.
- **Acesso rápido**: botão "hambúrguer" no header ativa/desativa.
- **Conteúdo**: mesmo conjunto de itens atual (Dashboard, Equipamentos, Chamados, Preventivas, Calendário, Relatórios, Usuários) + espaço para novos módulos.
- **Estado ativo**: indica página atual com gradient e bullet luminoso.

### 2.2 Header V2
- Posicionado no topo, altura 64px.
- Elementos:
  - **Logo + Nome**.
  - **Controle da sidebar** (hambúrguer / pin).
  - **Busca global** (opcional) com sugestões.
  - **Indicadores rápidos** (notificações, tarefas pendentes).
  - **Avatar/Perfil + menu** (logout, configurações, relatórios pessoais).
- **Responsividade**: em telas menores, agrupar notificações e perfil em um menu dropdown.

### 2.3 Área de Conteúdo Dinâmica
- Layout em colunas flexíveis, ocupando 100% da largura disponível após considerar o estado da sidebar.
- Modos específicos:
  - **Grid**: cards ajustam largura automaticamente (mín. 300px). Botão "full screen" esconde header e sidebar momentaneamente.
  - **Kanban**: colunas com largura mínima de 320px, rolagem horizontal, altura total da viewport. Barra superior fixa com filtros e mudança de visualização.
  - **Lista/Tabela**: tabela responsiva, colunas reordenáveis, sticky header.
- **Breadcrumb contextual** para indicar nível atual (ex.: Preventivas > Plano #123 > OS #456).

### 2.4 Drawer Contextual (opcional)
- Painel lateral direito que pode abrir para chat, checklist, histórico ou anexos sem sair da tela principal.
- Ocupa até 30% da largura, overlay no mobile.

## 3. Fluxos de Navegação

### 3.1 Desktop
1. Usuário acessa página com sidebar expandida (padrão).
2. Ao clicar no controle de layout, sidebar recolhe e conteúdo expande automaticamente.
3. Se clicar no botão "full screen" da área principal, sidebar recolhe e header oculta, exibindo apenas conteúdo; tecla `Esc` ou botão "sair do modo" restaura.

### 3.2 Mobile/Tablet
1. Sidebar não aparece inicialmente; botão hambúrguer abre overlay.
2. Selecionar item fecha overlay automaticamente.
3. Header exibe apenas ícones essenciais (hambúrguer, título da tela, ações rápidas).

### 3.3 Alternância de Visualização (Grid <-> Kanban)
- Controle posicionado na barra de ferramentas da página (já existente).
- Quando sidebar está em overlay ou compacta, a área de cartões/colunas ocupa 100% da largura.
- Estado escolhido persiste por usuário.

## 4. Estados & Interações
| Interação | Resultado |
| --- | --- |
| Clique em hambúrguer (desktop) | Sidebar alterna entre expandido e compacto. |
| Clique longo no hambúrguer | Opção de fixar em overlay/sempre fechado. |
| Resize de janela < 1024px | Sidebar automaticamente entra em modo overlay; botão indica estado. |
| Hover em ícones (modo compacto) | Exibe tooltip com label. |
| Atalho de teclado `Ctrl+B` | Alterna expandido/compacto. |
| Atalho de teclado `Ctrl+K` | Abre busca global (command palette). |

## 5. Requisitos Técnicos
- **Feature flag** `enableLayoutV2` para ativar gradualmente.
- **Contexto React** (ex.: `LayoutContext`) para compartilhar estado da sidebar, modo tela cheia, preferências.
- **Persistência**: `localStorage` com chave `sgm-layout-settings` contendo `sidebarMode`, `lastViewMode`, `fullScreen`.
- **Responsividade** via Tailwind CSS + CSS variables (breakpoints customizados: `lg=1024px`, `xl=1280px`).
- **Animações**: usar Framer Motion para transições da sidebar e drawer.

## 6. Guia para UX
- Produzir **wireframes em Figma** contemplando:
  - Página Equipamentos (Grid e Kanban) com sidebar nos três modos.
  - Fluxo mobile exibindo overlay.
  - Telas com drawer (ex.: chat em chamados).
  - Estados vazios, carregando e erro.
- Criar protótipo navegável demonstrando:
  - Alternância expandido/compacto.
  - Full screen para Kanban.
  - Chamado com drawer de comunicação.

## 7. Guia para Desenvolvimento
1. Criar diretório `components/layout-v2/` com `Sidebar`, `Header`, `LayoutShell`.
2. Implementar contexto e hooks (`useLayoutSettings`).
3. Adicionar feature flag no `MainLayout` atual para alternar entre V1/V2.
4. Ajustar páginas principais para responder ao novo layout (remover paddings fixos, usar `min-h-screen`, etc.).
5. Implementar testes de snapshot/responsive.

## 8. Critérios de Aceite
- Usuário consegue alternar entre sidebar expandida e compacta com animação suave.
- Em telas ≤1024px, sidebar muda automaticamente para overlay e o conteúdo ocupa toda a largura.
- Kanban/Grid exibem pelo menos 20% mais largura útil comparado ao layout V1 (métrica a validar via QA).
- Preferências de layout persistem após recarregar a página.
- Modo full screen disponível nas páginas de trabalho e sai com `Esc` ou botão.

## 9. Próximas Entregas Relacionadas
- Wireframes V2 (UX) → ETA Semana 2
- POC técnica (Dev) com feature flag → ETA Semana 3
- Teste piloto com usuários internos → após validação da POC

---
*Documento complementar ao planejamento V2. Atualizações serão feitas conforme wireframes e POCs evoluírem.*

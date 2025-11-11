# Estrutura Completa do Projeto SGM

## 1. Visão Geral

- **Nome**: Sistema de Gestão de Manutenção (SGM)
- **Objetivo**: Centralizar controle de equipamentos, chamados corretivos, planos preventivos e relatórios operacionais.
- **Arquitetura**: Aplicação full-stack dividida em backend Node.js/Express com banco SQLite e frontend Next.js 16 com React 18.
- **Padrão de Repositório**: Monorepositório com pastas dedicadas para backend, frontend, documentação e scripts de automação.

```
sgm/
├─ backend/
├─ nextjs-frontend/
├─ docs/
├─ exemplo/
├─ .vscode/
├─ *.md (documentação operacional)
└─ scripts *.bat/.ps1 (auxílio de setup)
```

## 2. Backend (`backend/`)

### 2.1 Tecnologias e Dependências

- **Node.js / Express 5**: Framework HTTP principal.
- **SQLite3**: Banco relacional criptográfico simples (arquivo `sgm.db`).
- **jsonwebtoken**: Autenticação via JWT.
- **bcrypt**: Hashing de senhas.
- **zod**: Validação e tipagem das requisições.
- **multer**: Upload de arquivos.
- **cors, morgan, express-rate-limit, cookie-parser**: Middlewares de infraestrutura.

### 2.2 Scripts NPM

- `start`: `node -r dotenv/config server.js`
- `dev`: `nodemon -r dotenv/config --ext js,json,env server.js`
- `test`: `jest`

### 2.3 Estrutura de Pastas

```
backend/
├─ server.js
├─ database.js
├─ middleware/
│  └─ auth.js
├─ routes/
│  ├─ auth.js
│  ├─ users.js
│  ├─ equipment.js
│  ├─ calls.js
│  ├─ plans.js
│  ├─ maintenance.js
│  ├─ dashboard.js
│  ├─ reports.js
│  └─ demo.js
├─ scripts/
│  ├─ create-admin.js
│  ├─ fix_demo_data.js
│  └─ remove_demo_preventives_specific.js
├─ uploads/
│  ├─ equipment/
│  └─ calls/
├─ sgm.db (arquivo SQLite gerado em runtime)
├─ package.json
└─ package-lock.json
```

### 2.4 Inicialização (`server.js`)

- Configura middlewares globais: CORS (com origem do frontend), JSON, cookies, morgan, rate limiting (ajustado por `NODE_ENV`).
- Define health check em `/api/health`.
- Registra todas as rotas de negócio sob `/api/*`.
- Implementa handlers para 404 e erros genéricos.
- Escuta na porta configurada por `PORT` (default 3001).

### 2.5 Banco de Dados (`database.js`)

- Resolve caminho do banco (`DB_PATH` via `.env` ou `backend/sgm.db`).
- Garante existência do diretório e instancia `sqlite3.Database` com logging.
- Função `initializeDatabase()` cria todas as tabelas caso não existam e aplica “migrações” idempotentes via `addColumnIfNotExists`.
- Helpers `query`, `get`, `run` encapsulam execução de statements com Promises.

#### 2.5.1 Principais Tabelas

- `users`: credenciais, papel (`admin`, `manager`, `technician`, `requester`), nome completo, departamento.
- `equipment`: informações técnicas, localização, criticidade, métricas de manutenção (`last_preventive_date`, `mtbf`, etc.) e flag `is_demo`.
- `equipment_documents`: anexos vinculados ao equipamento.
- `maintenance_calls`: chamados corretivos com fluxo completo (status, prioridade, atribuição, datas de execução e pausa, notas, peças).
- `call_activities` e `call_history`: atividades registradas e histórico de mudanças.
- `call_documents`: arquivos/fotos por fase do chamado.
- `preventive_plans`: planos com frequência (`days`, `weeks`, `months`, `hours`, `cycles`), instruções, ferramentas, procedimentos de segurança.
- `maintenance_orders`: ordens de serviço (principalmente preventivas) geradas por planos ou manualmente, com status, responsáveis e tempos.
- `maintenance_history`: histórico de ações em OS.

### 2.6 Middleware de Autenticação (`middleware/auth.js`)

- Lê token do header `Authorization` ou cookie `token`.
- Verifica JWT com `JWT_SECRET` (default `sgm_secret_key_change_in_production`).
- Carrega usuário do banco e anexa em `req.user`.
- Exporta `authorize(...roles)` para restringir operações por papel.
- `generateToken(userId)` gera JWT com expiração `JWT_EXPIRATION` (default 24h).

### 2.7 Rotas

#### 2.7.1 Autenticação (`routes/auth.js`)

- `POST /login`: valida credenciais, aplica rate limiter específico, usa bcrypt para comparar senha, retorna token (cookie httpOnly + payload JSON).
- `POST /register`: criação de usuário (liberada em desenvolvimento; em produção recomendável restringir).
- `GET /me`: devolve usuário autenticado.
- `POST /logout`: limpa cookie `token`.

#### 2.7.2 Usuários (`routes/users.js`)

- Endpoints protegidos, exigem `authenticate` e em alguns casos `authorize`.
- `GET /`: lista usuários (apenas `admin`/`manager`).
- `GET /technicians`: fornece técnicos elegíveis para atribuição.
- `GET /:id`: autoriza acesso próprio ou de `admin/manager`.
- `POST /`: criação (somente `admin`).
- `PUT /:id`: atualização (usuário próprio ou `admin`); limita mudança de papel a `admin`.
- `DELETE /:id`: remoção (somente `admin`), bloqueia autoexclusão.

#### 2.7.3 Equipamentos (`routes/equipment.js`)

- Filtros por `search`, `status`, `criticality`, `manufacturer`, `location`; paginação (`page`, `limit`).
- Inclusão automática de dados demo enquanto não houver registros reais.
- `GET /:id`: retorna detalhes + histórico combinado (ordens preventivas e chamados corretivos) e documentos anexos.
- CRUD completo baseado em Zod.
- Upload/Download/Exclusão de documentos via Multer (10MB, formatos permitidos: imagens, PDF, DOC/DOCX).

#### 2.7.4 Chamados Corretivos (`routes/calls.js`)

- Suporta diferentes perfis: técnicos veem chamados atribuídos a si ou criados por eles; solicitantes veem apenas os próprios; `admin/manager` têm visão ampla.
- Fluxo completo com endpoints para criar, atualizar (status, prioridade, atribuição, notas, peças), atividades, iniciar, pausar, retomar, concluir e cancelar chamados.
- Calcula tempo de execução considerando pausas.
- Atualiza `equipment.last_corrective_date` quando concluído.
- Upload de documentos/fotos por fase (durante/depois).

#### 2.7.5 Planos Preventivos (`routes/plans.js`)

- Listagem com estatísticas (total de OS, concluídas, atrasadas, taxa de conformidade, tempo médio).
- `GET /:id`: detalhes + ordens relacionadas.
- `POST /`: cria plano e gera primeira OS.
- `PUT /:id`: atualiza parâmetros.
- `DELETE /:id`: remove plano.
- `POST /:id/toggle`: ativa/desativa plano.
- `POST /:id/generate-order`: cria OS manualmente.
- `POST /generate-orders`: job para gerar OS quando planos atingem próxima data.

#### 2.7.6 Ordens Preventivas (`routes/maintenance.js`)

- `GET /`: lista ordens preventivas com filtros.
- `GET /:id`: traz OS com informações do plano e equipamento.
- `PUT /:id`: atualiza status, atribuição, tempos, notas, peças, cancelamento.
- `POST /:id/complete`: conclui OS, calcula tempo de execução, gera próxima ordem automaticamente com base na frequência do plano e atualiza `equipment.last_preventive_date` / `next_preventive_date`.
- Endpoints específicos para pausar, retomar, cancelar, deletar.
- `GET /calendar/events`: feed de eventos para o calendário do frontend.

#### 2.7.7 Dashboard (`routes/dashboard.js`)

- KPIs: total/ativos de equipamentos, chamados abertos/em execução, preventivas pendentes/atrasadas, taxa de conformidade, MTTR.
- Gráficos: chamados por status, chamados nos últimos N dias, preventivas por status, equipamentos por status.

#### 2.7.8 Relatórios (`routes/reports.js`)

- Conformidade de preventivas (on-time, atrasadas).
- MTBF e MTTR por equipamento.
- Custos estimados (baseado em tempo médio e custo/h aprox.).
- Performance de técnicos (tarefas, tempos médios, eficiência).
- Séries de chamados por período (dia/semana/mês).
- Ranking de equipamentos críticos por volume de chamados e criticidade.

#### 2.7.9 Dados Demo (`routes/demo.js`)

- `POST /create-equipment`: gera 10 equipamentos demo completos com chamados e planos realistas.
- `DELETE /clear`: limpa dados demo.
- `POST /clear-on-logout`: limpeza automática ao deslogar.

### 2.8 Uploads (`uploads/`)

- `equipment/`: documentos anexados aos equipamentos.
- `calls/`: fotos/anexos de chamados.
- Estratégia: arquivos são salvos com prefixo timestamp + random ID; caminhos armazenados no banco.

### 2.9 Scripts (`scripts/`)

- `create-admin.js`: cria usuário admin inicial.
- `fix_demo_data.js`: corrige dados de demonstração.
- `remove_demo_preventives_specific.js`: limpa preventivas demo específicas.

### 2.10 Variáveis de Ambiente Relevantes

- `PORT`: porta do backend.
- `FRONTEND_URL`: origem permitida no CORS.
- `DB_PATH`: caminho alternativo para o banco.
- `JWT_SECRET`, `JWT_EXPIRATION`.
- `NODE_ENV`: controla rate limiting agressivo em produção.

## 3. Frontend (`nextjs-frontend/`)

### 3.1 Tecnologias e Dependências

- **Next.js 16 (App Router)** com React 18.
- **Tailwind CSS** + `tailwind-merge` para composição de classes.
- **Framer Motion**: animações.
- **Chart.js + react-chartjs-2 + date-fns**: gráficos.
- **@tanstack/react-table**: tabelas interativas.
- **Lucide-react**: ícones.

### 3.2 Scripts NPM

- `dev`: `next dev -p 3000 -H 0.0.0.0`
- `dev:local`: `next dev -p 3000`
- `build`: `next build`
- `start`: `next start`
- `lint`: `next lint`

### 3.3 Estrutura de Pastas

```
nextjs-frontend/
├─ app/
│  ├─ page.tsx (redirect login/dashboard)
│  ├─ login/
│  ├─ dashboard/
│  ├─ equipment/
│  │  ├─ page.tsx
│  │  ├─ new/page.tsx
│  │  └─ [id]/(page|edit/page).tsx
│  ├─ calls/
│  │  ├─ page.tsx
│  │  ├─ new/page.tsx
│  │  └─ [id]/(page|edit/page).tsx
│  ├─ plans/
│  │  ├─ page.tsx
│  │  ├─ calendar/page.tsx
│  │  ├─ new/page.tsx
│  │  └─ [id]/(page|edit/page).tsx
│  ├─ maintenance/[id]/page.tsx
│  ├─ users/
│  │  ├─ page.tsx
│  │  ├─ new/page.tsx
│  │  └─ [id]/edit/page.tsx
│  └─ reports/page.tsx
├─ components/
│  ├─ layout/(Header|Sidebar|MainLayout).tsx
│  ├─ equipment/UploadDocuments.tsx
│  ├─ ui/(Button|Input|Badge).tsx
│  └─ Toast.tsx
├─ contexts/AuthContext.tsx
├─ hooks/useToast.ts
├─ lib/api.ts
├─ types/index.ts (tipos compartilhados)
├─ app/globals.css (Tailwind)
├─ tailwind.config.ts, postcss.config.js
├─ tsconfig.json, next.config.js
└─ package.json
```

### 3.4 Layout e Contextos

- `app/layout.tsx`: registra metadados e envolve app com `AuthProvider`.
- `AuthContext`: controla usuário logado, carrega `/auth/me`, abstrai `login`/`logout`, fornece `hasRole` e `loading`.
- `MainLayout`: protege rotas autenticadas, exibe cabeçalho, sidebar e container de toasts.
- `Sidebar`: menu dinâmico conforme papel do usuário.
- `Header`: dados do usuário atual + botão de logout.

### 3.5 Biblioteca HTTP (`lib/api.ts`)

- Base URL: `NEXT_PUBLIC_API_URL` (default `http://localhost:3001/api`).
- `fetchData`, `postData`, `putData`, `deleteData`: adicionam token do `localStorage`, incluem cookies e interceptam erros 401 para redirecionar ao login.

### 3.6 Componentes e Hooks

- `components/ui/Button.tsx`: estados de carregamento, variantes (`primary`, `secondary`).
- `components/ui/Input.tsx`: suporte a ícones, toggling de senha, label.
- `components/ui/Badge.tsx`: rótulos estilizados.
- `components/Toast.tsx` + `hooks/useToast.ts`: sistema global de notificações.
- `components/equipment/UploadDocuments.tsx`: modal/upload com validação.

### 3.7 Principais Páginas e Fluxos

#### 3.7.1 Login (`app/login/page.tsx`)

- Formulário animado (Framer Motion), validação, feedback de erros.
- Após sucesso, redireciona para `/dashboard` via `AuthContext.login`.

#### 3.7.2 Dashboard (`app/dashboard/page.tsx`)

- Consome KPIs e gráficos via `/dashboard/*` e `/reports/technicians-performance`.
- Cards interativos com sinais visuais (alertas para pendências/atrasos).
- Gráficos de pizza, barras e linhas com personalização de tooltip.

#### 3.7.3 Equipamentos (`app/equipment/page.tsx`)

- Listagem com busca, filtros, paginação, toggling entre grid e kanban.
- Kanban suporta drag-and-drop (HTML5) para alterar status (chama `PUT /equipment/:id`).
- Botão **Demo** dispara `/demo/create-equipment` e recarrega listagem.
- Ações condicionadas por papel (`admin`/`manager` podem criar/editar/excluir).

#### 3.7.4 Detalhes de Equipamento (`app/equipment/[id]/page.tsx`)

- Mostra dados técnicos completos, links para documentos, histórico de OS e chamados.
- Gráficos e indicadores (MTBF, MTTR) apresentam tendência.

#### 3.7.5 Chamados (`app/calls/...`)

- Página principal: tabela com filtros, colunas customizadas (status, prioridade, responsável, SLA).
- Formulário `new` para abertura (seleção de equipamento, prioridade, descrição).
- Página de detalhe mostra timeline (atividades, histórico), anexos organizados por fase, botões de fluxo (iniciar, pausar, retomar, concluir, cancelar).
- Modal para registrar atividades adicionais.

#### 3.7.6 Planos Preventivos (`app/plans/...`)

- Listagem com indicadores (total de OS, conformidade, próxima execução).
- Detalhe exibe ordens associadas, taxa de conformidade, tempo médio, histórico de execução.
- Página `calendar` mostra eventos (coloridos por status) utilizando feed `/maintenance/calendar/events`.
- Formulário `new`/`edit` inclui campos de instruções, materiais, segurança e responsável.

#### 3.7.7 Ordens (`app/maintenance/[id]/page.tsx`)

- Centraliza status atual, timestamps, tempo total vs pausas, observações e peças utilizadas.
- Botões acionam endpoints de atualização (`/maintenance/:id/...`).

#### 3.7.8 Relatórios (`app/reports/page.tsx`)

- Consolida diversas visualizações (gráficos, tabelas) a partir de `/reports/*`.
- Inclui filtros por período e equipamento.
- Exibe ranking de equipamentos críticos e painel de custos estimados.

#### 3.7.9 Usuários (`app/users/...`)

- Tabela de usuários, criação/edição com definição de papel, departamento, nome completo.
- Restrições: somente `admin`/`manager` acessam; apenas `admin` altera papéis.

### 3.8 Tipos Compartilhados (`types/index.ts`)

- Define interfaces para Equipment, MaintenanceCall, PreventivePlan, MaintenanceOrder, etc.
- Observação: `User.role` na tipagem precisa incluir `manager` e `requester` para alinhamento com backend.

### 3.9 Estilos e Temas

- `app/globals.css`: configura Tailwind, fontes e estilos base (tema dark com tons de slate/verde).
- Tailwind configurado com `content` apontando para `app`, `components` e `lib`.
- Uso extensivo de gradientes, blur, animações (`animate-spin`, `motion.div`).

### 3.10 Estados e Feedback

- `AuthContext` previne flicker através da flag `loading`.
- `MainLayout` exibe spinner enquanto autenticação é verificada.
- `useToast` fornece `success`, `error` para feedback consistente.

### 3.11 Integração com Backend

- Chamadas REST com token + cookie; frontend sempre envia `credentials: 'include'`.
- Tratamento de `include_demo` para garantir dados de demonstração quando base real vazia.
- `logout` chama `/demo/clear-on-logout` antes de `/auth/logout` para remover dados fictícios.

## 4. Documentação e Scripts de Suporte

- `README.md`, `README-INICIO.md`, `SETUP-COMPLETO.md`: orientações de instalação, inicialização e fluxo operacional.
- `CURSOR-ENVIRONMENT-SETUP.md`, `CONFIGURACAO-CURSOR-COMPLETA.json`, `aplicar-configuracao-cursor.ps1`: ajustes para ambiente Cursor/IDE.
- `COMO_EXECUTAR_PREVENTIVA.md`, `COMO_FAZER_PREVENTIVAS.md`: roteiros de operação de ordens preventivas.
- `TESTE_CHAMADOS.md`: procedimentos de teste de chamados.
- `DEPLOY.md`, `QUICK_START_DEPLOY.md`, `RESUMO_DEPLOY.md`: guias de deploy.
- Scripts `.bat`/`.ps1` (`INICIAR.bat`, `INICIAR-AMBOS.bat`, `INSTALAR.bat`): simplificam start simultâneo de backend e frontend em Windows.

## 5. Papéis e Permissões

| Papel        | Acesso Principal                                                                          |
| ------------ | ----------------------------------------------------------------------------------------- |
| `admin`      | Controle total: usuários, equipamentos, chamados, planos, ordens, relatórios, dados demo. |
| `manager`    | Similar a admin, exceto criação/remoção de usuários admins.                               |
| `technician` | Visualiza/atua em equipamentos, chamados e preventivas; acesso a relatórios operacionais. |
| `requester`  | Abre e acompanha chamados próprios; visualiza dashboard básico e chamados criados.        |

## 6. Fluxos Estratégicos

### 6.1 Autenticação

1. Usuário acessa `/login` e envia credenciais.
2. Backend valida, retorna token (cookie + JSON) e dados do usuário.
3. `AuthContext` persiste token em `localStorage`, redireciona para `/dashboard`.
4. Em navegações seguintes, `MainLayout` chama `/auth/me`; se falhar, limpa token e manda para `/login`.

### 6.2 Chamado Corretivo

1. Usuário cria chamado (`POST /calls`) selecionando equipamento e descrevendo problema.
2. `admin/manager` atribui a técnico (`PUT /calls/:id`).
3. Técnico inicia execução (`POST /calls/:id/start`), podendo pausar/retomar.
4. Ao concluir (`POST /calls/:id/complete`), backend calcula tempo efetivo, atualiza equipamento e registra histórico.

### 6.3 Plano Preventivo

1. `admin/manager` cadastra plano (`POST /plans`). Primeira OS é criada automaticamente.
2. Técnicos acessam ordens em `/maintenance`; iniciam execução, pausam se necessário.
3. Conclusão (`POST /maintenance/:id/complete`) calcula tempo, atualiza equipamento e agenda próxima prevenção.
4. Dashboard/relatórios refletem pendências, atrasos e conformidade.

## 7. Deploy e Operação

### 7.1 Variáveis de Ambiente

- Frontend: `NEXT_PUBLIC_API_URL` apontando para backend.
- Backend: `.env` com `PORT`, `FRONTEND_URL`, `JWT_SECRET`, `DB_PATH` (opcional) e configurações de rate limit.

### 7.2 Execução em Desenvolvimento

1. `npm install` em `backend/` e `nextjs-frontend/`.
2. Backend: `npm run dev` (porta 3001).
3. Frontend: `npm run dev` (porta 3000).
4. Scripts `.bat`/`.ps1` podem iniciar ambos simultaneamente em Windows.

### 7.3 Build Produção

- Backend: hospedar `server.js` atrás de reverse proxy (Nginx, etc.), garantir persistência do arquivo `sgm.db` e pasta `uploads/`.
- Frontend: `npm run build` + `npm run start` (Next.js). Ajustar `NEXT_PUBLIC_API_URL` para domínio do backend.

### 7.4 Persistência de Dados

- Banco SQLite: usar backup agendado do arquivo `sgm.db`.
- Uploads: armazenados em disco; considerar storage externo em produção (S3, Azure Blob).

## 8. Pontos de Atenção e Melhorias Futuras

- **Testes Automatizados**: Jest e Supertest configurados no backend; falta cobertura.
- **Migrações Estruturadas**: Atual abordagem via `ALTER TABLE` pode ser aprimorada com ferramenta formal (Knex, Prisma Migrate).
- **Consistência de Tipos**: alinhar enums de papéis no frontend.
- **Internacionalização**: atualmente somente PT-BR.
- **Logging/Observabilidade**: implementar logs estruturados e tracing (ex.: Winston, OpenTelemetry) em produção.
- **Escalabilidade**: para cargas maiores, considerar PostgreSQL (já há dependência `pg`), ou abstrair acesso via camada ORM.

## 9. Recursos de Apoio

- **Documentação Operacional**: consulte arquivos `README-INICIO.md`, `COMO_EXECUTAR_PREVENTIVA.md`, `TESTE_CHAMADOS.md` para passo a passo de uso.
- **Scripts de Demonstração**: botão “Demo” no frontend cria cenário completo para apresentações/testes rápidos.
- **Contato Técnico**: manter `create-admin.js` para provisionar usuário administrador quando implantar em novo ambiente.

---

Este documento resume toda a estrutura técnica do SGM e serve como guia de referência para desenvolvedores, analistas e equipe de operações. Ajustes adicionais podem ser realizados conforme novas funcionalidades forem incorporadas ou arquitetura evoluir.

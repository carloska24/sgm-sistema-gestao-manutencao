# Plano de Migração Técnica – SGM V2

## 1. Objetivo
Garantir que a infraestrutura do SGM suporte as novas capacidades da V2 (offline, materiais, comunicação em tempo real, integrações) com segurança e escalabilidade.

## 2. Diagnóstico Atual
- **Backend**: Node.js/Express 5 rodando com SQLite (arquivo `sgm.db`).
- **Frontend**: Next.js 16 servindo conteúdo estático/dinâmico.
- **Deploy**: scripts locais; ausência de pipeline automatizado.
- **Armazenamento**: uploads em disco local.
- **Observabilidade**: logs via console (morgan), sem agregação centralizada.

## 3. Requisitos V2
1. **Maior concorrência**: vários técnicos conectados simultaneamente (chat, sync offline).
2. **Transações estruturadas**: registro de materiais, checklists, histórico detalhado.
3. **Integrações externas**: webhooks, sensores, ERP.
4. **Notificações e tempo real**: websockets/push.
5. **Segurança**: autenticação robusta, rastreabilidade.

## 4. Estratégia de Migração
### 4.1 Banco de Dados
- **Decisão**: migrar para PostgreSQL 14+ (docker-compose disponível em `docker-compose.yml`).
- **Passos**:
  1. Modelar schemas equivalentes às tabelas atuais (users, equipment, etc.) com tipos adequados.
  2. Implementar camada de acesso usando `pg` ou ORM (ex.: Prisma/Knex). Avaliar adoção de Prisma para acelerar migrações futuras.
  3. Escrever scripts de migração para transportar dados de SQLite → Postgres.
  4. Atualizar backend para usar conexão Postgres via pool.
  5. Implementar migrações versionadas (Prisma Migrate ou Knex migrations).
  6. Validar integridade e performance antes do corte.

### 4.2 Armazenamento de Arquivos
- **Opção recomendada**: mover para storage gerenciado (Amazon S3, Azure Blob ou MinIO). Ambiente local de referência disponível no `docker-compose.yml` (serviço `minio`).
- **Ações**:
  - Abstrair módulo de upload para suportar provider local/externo.
  - Configurar buckets com políticas de acesso e versionamento.
  - Atualizar front para consumir URLs assinadas quando necessário.

### 4.3 Autenticação e Sessões
- Manter JWT, porém reforçar:
  - Rotação de secret keys.
  - Refresh tokens com curta duração para acessos mobile.
  - Audit log de login/logout.

### 4.4 Comunicação em Tempo Real
- Introduzir **WebSocket** (ex.: Socket.IO) ou **Web Push + SSE** para chat/notificações.
- Planejar escalabilidade (cluster + adapter Redis se necessário).

### 4.5 Infraestrutura e Deploy
- Configurar pipeline CI/CD (GitHub Actions, GitLab CI ou similar) com etapas:
  - Lint/testes
  - Build
  - Deploy staging
- Containerização (Docker) para padronizar ambientes.
- Orquestração: optar por serviço gerenciado (ECS, Kubernetes) ou VM gerenciada.
- Banco Postgres gerenciado (RDS/Azure Database) para reduzir overhead.

### 4.6 Observabilidade
- Integrar logs (Winston + Logstash/Elastic ou serviços como Datadog).
- Monitoramento de métricas (CPU/RAM, tempo de resposta) e alertas.
- Rastreabilidade de eventos críticos (criação de OS, alterações de status).

## 5. Plano de Ação
| Fase | Atividades | Responsáveis | Prazo estimado |
| --- | --- | --- | --- |
| Planejamento | Selecionar stack (Postgres, storage, CI/CD) | Tech Lead | Semana 1 |
| Protótipo | Subir ambiente staging Postgres + storage | DevOps | Semana 2 |
| Adaptação backend | Ajustar camada de dados, migrações | Backend | Semana 3-4 |
| Documentação | Atualizar variáveis de ambiente (ver `backend/env.example`) e instruções de uso do `docker-compose.yml` | Produto/DevOps | Semana 4 |
| Migração de dados | Exportar/importar SQLite → Postgres | DevOps + DBA | Semana 5 |
| Validação | Testes de regressão, performance | QA | Semana 6 |
| Cutover | Janela controlada para apontar produção | DevOps | Semana 7 |
| Pós-cutover | Monitoramento intensivo | Todos | Semana 8 |

## 6. Riscos e Mitigações
| Risco | Impacto | Mitigação |
| --- | --- | --- |
| Perda de dados na migração | Alto | Backup completo, dry-run em staging, scripts reversíveis. |
| Falhas em integrações | Médio | Testes de regressão automatizados e manuais. |
| Sobrecarga de infraestrutura | Médio | Iniciar com instâncias dimensionadas e autoscaling configurado. |
| Atraso devido à curva de aprendizado de ORM | Médio | Treinamento rápido, provar conceito com módulo menor. |

## 7. Checklist de Cutover
- [ ] Backup final do SQLite.
- [ ] Migração executada e validada em staging.
- [ ] Aplicação apontando para Postgres em staging sem erros.
- [ ] Testes de regressão (API + e2e) passam.
- [ ] Observabilidade configurada.
- [ ] Plano de rollback documentado.

## 8. Pós-Migração
- Descontinuar uso do arquivo `sgm.db` (manter somente para histórico).
- Configurar rotinas de backup automáticas para Postgres e storage.
- Revisar políticas de acesso (IAM) e credenciais.
- Atualizar documentação do projeto e `.env` exemplo.

---
*Atualize este plano conforme decisões de infraestrutura forem tomadas.*

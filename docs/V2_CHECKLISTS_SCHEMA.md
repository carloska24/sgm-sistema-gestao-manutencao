# Modelo de Dados – Checklists Inteligentes

## Visão Geral
Os checklists inteligentes estruturam inspeções e procedimentos passo a passo. O modelo suporta templates reutilizáveis e respostas associadas a ordens preventivas (`maintenance_orders`) ou chamados corretivos (`maintenance_calls`).

## Tabelas

### `checklist_templates`
| Coluna | Tipo | Descrição |
| --- | --- | --- |
| `id` | INTEGER PK | Identificador do checklist template. |
| `name` | TEXT | Nome do checklist (ex.: "Preventiva Mensal - Compressor"). |
| `description` | TEXT | Descrição opcional. |
| `entity_type` | TEXT | Sinaliza origem principal (`preventive_plan`, `maintenance_order`, `equipment`). |
| `entity_id` | INTEGER | ID da entidade associada (ex.: plano preventivo). |
| `is_active` | INTEGER | 1 ativo, 0 inativo. |
| `created_by` | INTEGER FK | Usuário que criou o template. |
| `created_at` / `updated_at` | DATETIME | Auditoria. |

### `checklist_template_items`
| Coluna | Tipo | Descrição |
| --- | --- | --- |
| `id` | INTEGER PK |
| `template_id` | INTEGER FK | Associa item ao template (cascade delete). |
| `order_index` | INTEGER | Ordenação exibida para o técnico. |
| `title` | TEXT | Título da etapa (ex.: "Verificar pressão"). |
| `instructions` | TEXT | Instruções detalhadas ou POP. |
| `input_type` | TEXT | Tipo de resposta (`boolean`, `number`, `text`, `multi`). |
| `required` | INTEGER | 1 obrigatório, 0 opcional. |
| `requires_photo` | INTEGER | 1 exige foto comprovante. |
| `requires_signature` | INTEGER | 1 exige assinatura digital. |
| `created_at` / `updated_at` | DATETIME |

### `checklist_responses`
| Coluna | Tipo | Descrição |
| --- | --- | --- |
| `id` | INTEGER PK |
| `template_id` | INTEGER FK | Referência ao template usado. |
| `item_id` | INTEGER FK | Item respondido. |
| `reference_type` | TEXT | `maintenance_order` ou `maintenance_call`. |
| `reference_id` | INTEGER | ID da OS/call. |
| `status` | TEXT | `pending`, `completed`, `skipped`, etc. |
| `value` | TEXT | Resposta capturada (s/n, valor numérico, texto). |
| `notes` | TEXT | Observações do técnico. |
| `photo_path` | TEXT | Caminho para evidência (armazenada em S3/MinIO). |
| `responded_by` | INTEGER FK | Usuário que registrou a resposta. |
| `responded_at` | DATETIME | Instante da resposta. |
| `created_at` / `updated_at` | DATETIME |

## Índices
- `idx_checklist_template_items_template` para lookup rápido dos itens por template.
- `idx_checklist_responses_reference` para recuperar respostas por OS/chamado.
- `idx_checklist_responses_item` para relatórios por item.

## Fluxos Esperados
1. **Cadastro de template**: criação/edição via interface V2 (épico 3) com itens ordenados e requisitos.
2. **Associação automática**: planos preventivos vinculam templates padrão. Chamados podem receber checklists sugeridos por tipo de equipamento.
3. **Execução em campo**: respostas gravadas em `checklist_responses`, incluindo anexos (fotos) e assinaturas.
4. **Auditoria**: timestamps e usuário responsivo permitem rastreabilidade para auditorias e conformidade.

## Próximas Etapas de Implementação
- Criar endpoints REST para CRUD de templates e persistência de respostas.
- Integrar uploads (MinIO/S3) para `photo_path`.
- Exibir checklists nas telas de OS/chamados conforme layout V2.
- Adicionar relatórios de conformidade e métricas por checklist.

---
*Documento complementar ao planejamento de checklists (épico 3).*

# Modelo inicial de dados

Todas as tabelas empresariais terão `company_id`, `created_at` e `updated_at` quando aplicável. Relacionamentos devem ser indexados e acompanhados de RLS.

| Entidade | Responsabilidade | Relações principais |
| --- | --- | --- |
| `companies` | tenant empresarial e dados gerais da DSS | 1:N com todas as entidades empresariais |
| `profiles` | usuário autenticado, empresa e papel | `auth.users` + `companies` |
| `customers` | pessoa física ou condomínio | `companies`, `customer_addresses` |
| `customer_addresses` | locais de atendimento | `customers`, `companies` |
| `service_types` | catálogo de serviços | `companies` |
| `service_requests` | pedidos públicos/internos | `customers`, `service_types`, `companies` |
| `request_attachments` | anexos privados de solicitações | `service_requests`, Storage |
| `quotes` | orçamento e ciclo de aprovação | `service_requests`, `customers` |
| `quote_items` | itens e valores do orçamento | `quotes` |
| `service_orders` | execução de serviço | `quotes`, `service_requests`, `profiles` |
| `appointments` | agenda de visitas e execução | `service_orders`, `customers`, `profiles` |
| `financial_transactions` | receitas e despesas | `companies`, referências operacionais |
| `activity_logs` | auditoria | `profiles`, empresa e entidade afetada |

## RLS planejada

A regra base é: o registro só pode ser lido ou alterado se o usuário autenticado tiver um `profiles.company_id` igual ao `company_id` do registro. Operações de configuração e financeiro devem exigir papel compatível. Solicitações públicas não devem abrir leitura pública; a entrada será limitada ao insert controlado, ou migrada para Edge Function se o antispam exigir segredo.

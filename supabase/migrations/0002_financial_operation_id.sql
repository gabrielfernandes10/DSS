-- Agrupa a receita e a despesa de uma mesma operação financeira.
-- Cada movimento continua separado para preservar relatórios e saldo,
-- mas os dois registros passam a compartilhar o mesmo operation_id.

alter table public.financial_transactions
  add column if not exists operation_id uuid;

update public.financial_transactions
set operation_id = id
where operation_id is null;

alter table public.financial_transactions
  alter column operation_id set default gen_random_uuid();

alter table public.financial_transactions
  alter column operation_id set not null;

create index if not exists financial_transactions_operation_id_idx
  on public.financial_transactions(operation_id);

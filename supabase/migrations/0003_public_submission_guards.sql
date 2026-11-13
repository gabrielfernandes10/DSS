-- Controle interno de frequência para os formulários públicos.
-- A tabela não possui políticas públicas: somente a Edge Function usa service_role.

create table if not exists public.public_submission_guards (
  id uuid primary key default gen_random_uuid(),
  guard_key_hash text not null,
  kind text not null check (kind in ('budget', 'assistance', 'contact')),
  created_at timestamptz not null default now()
);

create index if not exists public_submission_guards_lookup_idx
  on public.public_submission_guards(guard_key_hash, created_at desc);

alter table public.public_submission_guards enable row level security;

-- Links públicos com token hash para aprovação ou recusa de orçamentos.
create table if not exists public.quote_public_links (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  quote_id uuid not null references public.quotes(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  viewed_at timestamptz,
  decision text check (decision in ('approved', 'rejected')),
  decided_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists quote_public_links_quote_idx on public.quote_public_links(quote_id, created_at desc);
create index if not exists quote_public_links_token_idx on public.quote_public_links(token_hash);

alter table public.quote_public_links enable row level security;

create policy "company admins read quote public links" on public.quote_public_links for select to authenticated using (public.has_company_role(company_id, array['owner', 'admin']::public.staff_role[]));
create policy "company admins create quote public links" on public.quote_public_links for insert to authenticated with check (public.has_company_role(company_id, array['owner', 'admin']::public.staff_role[]));
create policy "company admins update quote public links" on public.quote_public_links for update to authenticated using (public.has_company_role(company_id, array['owner', 'admin']::public.staff_role[])) with check (public.has_company_role(company_id, array['owner', 'admin']::public.staff_role[]));
create policy "company admins delete quote public links" on public.quote_public_links for delete to authenticated using (public.has_company_role(company_id, array['owner', 'admin']::public.staff_role[]));

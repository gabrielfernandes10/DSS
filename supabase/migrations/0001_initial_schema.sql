-- DSS — Deni Sistemas de Segurança
-- Migration inicial: schema multiempresa, Auth, Storage e RLS.
-- Não insere dados de clientes, serviços ou operação.

create extension if not exists pgcrypto;

DO $$ BEGIN
  CREATE TYPE public.staff_role AS ENUM ('owner', 'admin', 'staff');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.request_status AS ENUM ('new', 'in_review', 'quoted', 'scheduled', 'closed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.request_source AS ENUM ('public_form', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.quote_status AS ENUM ('draft', 'sent', 'approved', 'rejected', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.service_order_status AS ENUM ('open', 'scheduled', 'in_progress', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.appointment_status AS ENUM ('scheduled', 'confirmed', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.transaction_type AS ENUM ('income', 'expense');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  email text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  full_name text not null,
  role public.staff_role not null default 'staff',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  full_name text not null,
  customer_type text not null default 'individual' check (customer_type in ('individual', 'condominium')),
  email text,
  phone text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  label text,
  postal_code text,
  street text,
  number text,
  complement text,
  neighborhood text,
  city text,
  state text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.service_types (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, name)
);

create table if not exists public.service_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  service_type_id uuid references public.service_types(id) on delete set null,
  status public.request_status not null default 'new',
  source public.request_source not null default 'admin',
  subject text,
  description text,
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.request_attachments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  request_id uuid not null references public.service_requests(id) on delete cascade,
  storage_path text not null unique,
  file_name text not null,
  mime_type text,
  byte_size bigint,
  created_at timestamptz not null default now()
);

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  request_id uuid references public.service_requests(id) on delete set null,
  status public.quote_status not null default 'draft',
  valid_until date,
  subtotal numeric(12,2) not null default 0,
  discount numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quote_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  quote_id uuid not null references public.quotes(id) on delete cascade,
  description text not null,
  quantity numeric(12,2) not null default 1 check (quantity > 0),
  unit_price numeric(12,2) not null default 0 check (unit_price >= 0),
  total numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.service_orders (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  quote_id uuid references public.quotes(id) on delete set null,
  request_id uuid references public.service_requests(id) on delete set null,
  assigned_profile_id uuid references public.profiles(id) on delete set null,
  status public.service_order_status not null default 'open',
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  description text,
  scheduled_for timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  service_order_id uuid references public.service_orders(id) on delete set null,
  assigned_profile_id uuid references public.profiles(id) on delete set null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status public.appointment_status not null default 'scheduled',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table if not exists public.financial_transactions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  service_order_id uuid references public.service_orders(id) on delete set null,
  type public.transaction_type not null,
  category text not null,
  description text,
  amount numeric(12,2) not null check (amount >= 0),
  occurred_on date not null default current_date,
  paid boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  actor_profile_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_name text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists profiles_company_id_idx on public.profiles(company_id);
create index if not exists customers_company_id_idx on public.customers(company_id);
create index if not exists customer_addresses_customer_id_idx on public.customer_addresses(customer_id);
create index if not exists service_types_company_id_idx on public.service_types(company_id);
create index if not exists service_requests_company_status_idx on public.service_requests(company_id, status);
create index if not exists request_attachments_request_id_idx on public.request_attachments(request_id);
create index if not exists quotes_company_status_idx on public.quotes(company_id, status);
create index if not exists quote_items_quote_id_idx on public.quote_items(quote_id);
create index if not exists service_orders_company_status_idx on public.service_orders(company_id, status);
create index if not exists appointments_company_starts_at_idx on public.appointments(company_id, starts_at);
create index if not exists financial_transactions_company_date_idx on public.financial_transactions(company_id, occurred_on);
create index if not exists activity_logs_company_created_at_idx on public.activity_logs(company_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

DO $$
DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'companies', 'profiles', 'customers', 'customer_addresses', 'service_types',
    'service_requests', 'quotes', 'quote_items', 'service_orders',
    'appointments', 'financial_transactions'
  ] LOOP
    EXECUTE format('drop trigger if exists %I_updated_at on public.%I', table_name, table_name);
    EXECUTE format('create trigger %I_updated_at before update on public.%I for each row execute function public.set_updated_at()', table_name, table_name);
  END LOOP;
END $$;

create or replace function public.current_user_company_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select company_id from public.profiles
  where id = auth.uid() and active = true
  limit 1;
$$;

create or replace function public.has_company_access(target_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and company_id = target_company_id
      and active = true
  );
$$;

create or replace function public.has_company_role(target_company_id uuid, allowed_roles public.staff_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and company_id = target_company_id
      and active = true
      and role = any(allowed_roles)
  );
$$;

create or replace function public.bootstrap_company(company_name text, company_slug text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare new_company_id uuid;
begin
  if auth.uid() is null then
    raise exception 'authentication_required';
  end if;
  if exists (select 1 from public.profiles where id = auth.uid()) then
    raise exception 'profile_already_exists';
  end if;
  insert into public.companies (name, slug)
  values (trim(company_name), lower(trim(company_slug)))
  returning id into new_company_id;
  insert into public.profiles (id, company_id, full_name, role)
  values (auth.uid(), new_company_id, coalesce(nullif(auth.jwt() -> 'user_metadata' ->> 'full_name', ''), 'Administrador'), 'owner');
  return new_company_id;
end;
$$;

grant execute on function public.bootstrap_company(text, text) to authenticated;

alter table public.companies enable row level security;
alter table public.profiles enable row level security;
alter table public.customers enable row level security;
alter table public.customer_addresses enable row level security;
alter table public.service_types enable row level security;
alter table public.service_requests enable row level security;
alter table public.request_attachments enable row level security;
alter table public.quotes enable row level security;
alter table public.quote_items enable row level security;
alter table public.service_orders enable row level security;
alter table public.appointments enable row level security;
alter table public.financial_transactions enable row level security;
alter table public.activity_logs enable row level security;

-- Permite reexecutar esta migration após uma execução parcial. O filtro remove apenas
-- políticas nomeadas pela DSS nas tabelas desta migration; não toca políticas externas.
DO $$
DECLARE policy_record record;
BEGIN
  FOR policy_record IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE (
        policyname LIKE 'company %'
        OR policyname IN ('users can read their company profiles', 'owners and admins can update profiles')
      )
      AND (
        (schemaname = 'public' AND tablename IN (
          'companies', 'profiles', 'customers', 'customer_addresses', 'service_types',
          'service_requests', 'request_attachments', 'quotes', 'quote_items',
          'service_orders', 'appointments', 'financial_transactions', 'activity_logs'
        ))
        OR (schemaname = 'storage' AND tablename = 'objects')
      )
  LOOP
    EXECUTE format('drop policy if exists %I on %I.%I', policy_record.policyname, policy_record.schemaname, policy_record.tablename);
  END LOOP;
END $$;

create policy "company members can read companies" on public.companies for select to authenticated using (public.has_company_access(id));
create policy "company owners can update companies" on public.companies for update to authenticated using (public.has_company_role(id, array['owner', 'admin']::public.staff_role[])) with check (public.has_company_role(id, array['owner', 'admin']::public.staff_role[]));

create policy "users can read their company profiles" on public.profiles for select to authenticated using (id = auth.uid() or public.has_company_access(company_id));
create policy "owners and admins can update profiles" on public.profiles for update to authenticated using (public.has_company_role(company_id, array['owner', 'admin']::public.staff_role[])) with check (public.has_company_role(company_id, array['owner', 'admin']::public.staff_role[]));

create policy "company members read customers" on public.customers for select to authenticated using (public.has_company_access(company_id));
create policy "company members create customers" on public.customers for insert to authenticated with check (public.has_company_access(company_id));
create policy "company members update customers" on public.customers for update to authenticated using (public.has_company_access(company_id)) with check (public.has_company_access(company_id));
create policy "company admins delete customers" on public.customers for delete to authenticated using (public.has_company_role(company_id, array['owner', 'admin']::public.staff_role[]));

create policy "company members read addresses" on public.customer_addresses for select to authenticated using (public.has_company_access(company_id));
create policy "company members create addresses" on public.customer_addresses for insert to authenticated with check (public.has_company_access(company_id));
create policy "company members update addresses" on public.customer_addresses for update to authenticated using (public.has_company_access(company_id)) with check (public.has_company_access(company_id));
create policy "company admins delete addresses" on public.customer_addresses for delete to authenticated using (public.has_company_role(company_id, array['owner', 'admin']::public.staff_role[]));

create policy "company members read service types" on public.service_types for select to authenticated using (public.has_company_access(company_id));
create policy "company admins create service types" on public.service_types for insert to authenticated with check (public.has_company_role(company_id, array['owner', 'admin']::public.staff_role[]));
create policy "company admins update service types" on public.service_types for update to authenticated using (public.has_company_role(company_id, array['owner', 'admin']::public.staff_role[])) with check (public.has_company_role(company_id, array['owner', 'admin']::public.staff_role[]));
create policy "company admins delete service types" on public.service_types for delete to authenticated using (public.has_company_role(company_id, array['owner', 'admin']::public.staff_role[]));

create policy "company members read requests" on public.service_requests for select to authenticated using (public.has_company_access(company_id));
create policy "company members create requests" on public.service_requests for insert to authenticated with check (public.has_company_access(company_id));
create policy "company members update requests" on public.service_requests for update to authenticated using (public.has_company_access(company_id)) with check (public.has_company_access(company_id));
create policy "company admins delete requests" on public.service_requests for delete to authenticated using (public.has_company_role(company_id, array['owner', 'admin']::public.staff_role[]));

create policy "company members read attachments" on public.request_attachments for select to authenticated using (public.has_company_access(company_id));
create policy "company members create attachments" on public.request_attachments for insert to authenticated with check (public.has_company_access(company_id));
create policy "company members delete attachments" on public.request_attachments for delete to authenticated using (public.has_company_access(company_id));

create policy "company members read quotes" on public.quotes for select to authenticated using (public.has_company_access(company_id));
create policy "company members create quotes" on public.quotes for insert to authenticated with check (public.has_company_access(company_id));
create policy "company members update quotes" on public.quotes for update to authenticated using (public.has_company_access(company_id)) with check (public.has_company_access(company_id));
create policy "company admins delete quotes" on public.quotes for delete to authenticated using (public.has_company_role(company_id, array['owner', 'admin']::public.staff_role[]));

create policy "company members read quote items" on public.quote_items for select to authenticated using (public.has_company_access(company_id));
create policy "company members create quote items" on public.quote_items for insert to authenticated with check (public.has_company_access(company_id));
create policy "company members update quote items" on public.quote_items for update to authenticated using (public.has_company_access(company_id)) with check (public.has_company_access(company_id));
create policy "company admins delete quote items" on public.quote_items for delete to authenticated using (public.has_company_role(company_id, array['owner', 'admin']::public.staff_role[]));

create policy "company members read service orders" on public.service_orders for select to authenticated using (public.has_company_access(company_id));
create policy "company members create service orders" on public.service_orders for insert to authenticated with check (public.has_company_access(company_id));
create policy "company members update service orders" on public.service_orders for update to authenticated using (public.has_company_access(company_id)) with check (public.has_company_access(company_id));
create policy "company admins delete service orders" on public.service_orders for delete to authenticated using (public.has_company_role(company_id, array['owner', 'admin']::public.staff_role[]));

create policy "company members read appointments" on public.appointments for select to authenticated using (public.has_company_access(company_id));
create policy "company members create appointments" on public.appointments for insert to authenticated with check (public.has_company_access(company_id));
create policy "company members update appointments" on public.appointments for update to authenticated using (public.has_company_access(company_id)) with check (public.has_company_access(company_id));
create policy "company admins delete appointments" on public.appointments for delete to authenticated using (public.has_company_role(company_id, array['owner', 'admin']::public.staff_role[]));

create policy "company members read transactions" on public.financial_transactions for select to authenticated using (public.has_company_access(company_id));
create policy "company admins create transactions" on public.financial_transactions for insert to authenticated with check (public.has_company_role(company_id, array['owner', 'admin']::public.staff_role[]));
create policy "company admins update transactions" on public.financial_transactions for update to authenticated using (public.has_company_role(company_id, array['owner', 'admin']::public.staff_role[])) with check (public.has_company_role(company_id, array['owner', 'admin']::public.staff_role[]));
create policy "company admins delete transactions" on public.financial_transactions for delete to authenticated using (public.has_company_role(company_id, array['owner', 'admin']::public.staff_role[]));

create policy "company admins read activity logs" on public.activity_logs for select to authenticated using (public.has_company_role(company_id, array['owner', 'admin']::public.staff_role[]));
create policy "company members create activity logs" on public.activity_logs for insert to authenticated with check (public.has_company_access(company_id));

insert into storage.buckets (id, name, public)
values ('request-attachments', 'request-attachments', false)
on conflict (id) do nothing;

create policy "company members read request files" on storage.objects for select to authenticated using (
  bucket_id = 'request-attachments'
  and public.has_company_access((storage.foldername(name))[1]::uuid)
);
create policy "company members upload request files" on storage.objects for insert to authenticated with check (
  bucket_id = 'request-attachments'
  and public.has_company_access((storage.foldername(name))[1]::uuid)
);
create policy "company members delete request files" on storage.objects for delete to authenticated using (
  bucket_id = 'request-attachments'
  and public.has_company_access((storage.foldername(name))[1]::uuid)
);

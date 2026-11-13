-- Checklist técnico e evidências de conclusão das Ordens de Serviço.

create table if not exists public.service_order_checklist_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  service_order_id uuid not null references public.service_orders(id) on delete cascade,
  label text not null,
  position integer not null default 0,
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (service_order_id, position)
);

create table if not exists public.service_order_evidence (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  service_order_id uuid not null references public.service_orders(id) on delete cascade,
  storage_path text not null unique,
  file_name text not null,
  mime_type text,
  byte_size bigint,
  created_at timestamptz not null default now()
);

create index if not exists service_order_checklist_order_idx on public.service_order_checklist_items(service_order_id, position);
create index if not exists service_order_evidence_order_idx on public.service_order_evidence(service_order_id, created_at desc);

alter table public.service_order_checklist_items enable row level security;
alter table public.service_order_evidence enable row level security;

DO $$ BEGIN
  create trigger service_order_checklist_items_updated_at before update on public.service_order_checklist_items for each row execute function public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

create policy "company members read order checklist" on public.service_order_checklist_items for select to authenticated using (public.has_company_access(company_id));
create policy "company members create order checklist" on public.service_order_checklist_items for insert to authenticated with check (public.has_company_access(company_id));
create policy "company members update order checklist" on public.service_order_checklist_items for update to authenticated using (public.has_company_access(company_id)) with check (public.has_company_access(company_id));
create policy "company admins delete order checklist" on public.service_order_checklist_items for delete to authenticated using (public.has_company_role(company_id, array['owner', 'admin']::public.staff_role[]));

create policy "company members read order evidence" on public.service_order_evidence for select to authenticated using (public.has_company_access(company_id));
create policy "company members create order evidence" on public.service_order_evidence for insert to authenticated with check (public.has_company_access(company_id));
create policy "company admins delete order evidence" on public.service_order_evidence for delete to authenticated using (public.has_company_role(company_id, array['owner', 'admin']::public.staff_role[]));

insert into storage.buckets (id, name, public)
values ('service-order-evidence', 'service-order-evidence', false)
on conflict (id) do nothing;

create policy "company members read order evidence files" on storage.objects for select to authenticated using (
  bucket_id = 'service-order-evidence'
  and public.has_company_access((storage.foldername(name))[1]::uuid)
);
create policy "company members upload order evidence files" on storage.objects for insert to authenticated with check (
  bucket_id = 'service-order-evidence'
  and public.has_company_access((storage.foldername(name))[1]::uuid)
);
create policy "company admins delete order evidence files" on storage.objects for delete to authenticated using (
  bucket_id = 'service-order-evidence'
  and public.has_company_role((storage.foldername(name))[1]::uuid, array['owner', 'admin']::public.staff_role[])
);

create table public.branch_services (
  id uuid not null default gen_random_uuid (),
  branch_id uuid not null,
  service_id uuid not null,
  tenant_id uuid not null,
  selling_price numeric not null default 0,
  duration_minutes integer null default 0,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint branch_services_pkey primary key (id),
  constraint branch_services_branch_id_service_id_key unique (branch_id, service_id),
  constraint branch_services_service_id_fkey foreign KEY (service_id) references services (id) on delete CASCADE,
  constraint branch_services_branch_id_fkey foreign KEY (branch_id) references branches (id) on delete CASCADE,
  constraint branch_services_tenant_id_fkey foreign KEY (tenant_id) references tenants (id) on delete CASCADE,
  constraint branch_services_selling_price_check check ((selling_price >= (0)::numeric)),
  constraint branch_services_duration_minutes_check check ((duration_minutes >= 0))
) TABLESPACE pg_default;

create trigger audit_branch_services_changes
after INSERT
or DELETE
or
update on branch_services for EACH row
execute FUNCTION audit_trigger_function ();

create trigger trigger_branch_services_updated_at BEFORE
update on branch_services for EACH row
execute FUNCTION update_updated_at_column ();
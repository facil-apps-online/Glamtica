-- supabase/migrations/20250710180000_multi_tenant_roles.sql

-- 1. Create new tables: tenants, branches, roles, users

-- Table: tenants
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  subscription_status TEXT NOT NULL DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'inactive', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
-- Add UNIQUE constraint separately to handle IF NOT EXISTS
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema = 'public' AND constraint_name = 'tenants_name_key') THEN
        ALTER TABLE public.tenants ADD CONSTRAINT tenants_name_key UNIQUE (name);
    END IF;
END $$;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
-- Use DROP/CREATE for policies as IF NOT EXISTS is not supported for policies
DROP POLICY IF EXISTS "Enable all operations for tenants" ON public.tenants;
CREATE POLICY "Enable all operations for tenants" ON public.tenants FOR ALL USING (true) WITH CHECK (true);

-- Table: branches
CREATE TABLE IF NOT EXISTS public.branches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
-- Add UNIQUE constraint separately to handle IF NOT EXISTS
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema = 'public' AND constraint_name = 'branches_tenant_id_name_key') THEN
        ALTER TABLE public.branches ADD CONSTRAINT branches_tenant_id_name_key UNIQUE (tenant_id, name);
    END IF;
END $$;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all operations for branches" ON public.branches;
CREATE POLICY "Enable all operations for branches" ON public.branches FOR ALL USING (true) WITH CHECK (true);

-- Table: roles
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE CHECK (name IN ('super_admin', 'tenant_super_admin', 'tenant_admin', 'tenant_user')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all operations for roles" ON public.roles;
CREATE POLICY "Enable all operations for roles" ON public.roles FOR ALL USING (true) WITH CHECK (true);

-- Table: users
CREATE TABLE IF NOT EXISTS public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL, -- Store hashed password
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE RESTRICT,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE, -- NULL for super_admin
  branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE, -- NULL for super_admin and tenant_super_admin
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
  -- Removed CHECK constraint here, will use trigger instead
);
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all operations for users" ON public.users;
CREATE POLICY "Enable all operations for users" ON public.users FOR ALL USING (true) WITH CHECK (true);


-- 2. Add tenant_id and branch_id to existing tables

-- Function to add columns if they don't exist
CREATE OR REPLACE FUNCTION add_tenant_branch_columns(table_name TEXT)
RETURNS VOID AS $$
BEGIN
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS tenant_id UUID;', table_name);
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS branch_id UUID;', table_name);
END;
$$ LANGUAGE plpgsql;

-- Apply to all relevant tables
SELECT add_tenant_branch_columns('clients');
SELECT add_tenant_branch_columns('stylists');
SELECT add_tenant_branch_columns('services');
SELECT add_tenant_branch_columns('products');
SELECT add_tenant_branch_columns('attentions');
SELECT add_tenant_branch_columns('purchases');
SELECT add_tenant_branch_columns('languages');
SELECT add_tenant_branch_columns('translations');
SELECT add_tenant_branch_columns('brands');
SELECT add_tenant_branch_columns('suppliers');
SELECT add_tenant_branch_columns('schedule_templates');
SELECT add_tenant_branch_columns('stylist_schedules');
SELECT add_tenant_branch_columns('stylist_time_off');
SELECT add_tenant_branch_columns('service_categories');
SELECT add_tenant_branch_columns('attention_service_products');
SELECT add_tenant_branch_columns('attention_products');
SELECT add_tenant_branch_columns('service_evidence');
SELECT add_tenant_branch_columns('service_sessions');
SELECT add_tenant_branch_columns('attention_services');
SELECT add_tenant_branch_columns('extra_service_sessions');
SELECT add_tenant_branch_columns('appointment_evidence');
SELECT add_tenant_branch_columns('appointment_products');
SELECT add_tenant_branch_columns('appointment_extra_services');
SELECT add_tenant_branch_columns('appointment_sessions');
SELECT add_tenant_branch_columns('appointments'); -- Keep for migration purposes
SELECT add_tenant_branch_columns('purchase_items');
SELECT add_tenant_branch_columns('product_stylist_commissions');
SELECT add_tenant_branch_columns('supplier_products');
SELECT add_tenant_branch_columns('service_stylist_commissions');
-- Settings table only needs tenant_id
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS tenant_id UUID;


-- 3. Insert initial data (roles, default tenant, default branch, initial users)

DO $$
DECLARE
  super_admin_role_id UUID;
  tenant_super_admin_role_id UUID;
  tenant_admin_role_id UUID;
  tenant_user_role_id UUID;
  default_tenant_id UUID;
  default_branch_id UUID;
BEGIN
  -- Insert roles
  INSERT INTO public.roles (name, description) VALUES
  ('super_admin', 'Controls all tenants and global configurations.'),
  ('tenant_super_admin', 'Manages a specific tenant, including branches and subscription.'),
  ('tenant_admin', 'Manages a specific branch within a tenant.'),
  ('tenant_user', 'Standard user with limited access within a branch.')
  ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;
  
  SELECT id INTO super_admin_role_id FROM public.roles WHERE name = 'super_admin';
  SELECT id INTO tenant_super_admin_role_id FROM public.roles WHERE name = 'tenant_super_admin';
  SELECT id INTO tenant_admin_role_id FROM public.roles WHERE name = 'tenant_admin';
  SELECT id INTO tenant_user_role_id FROM public.roles WHERE name = 'tenant_user';

  -- Insert default tenant
  INSERT INTO public.tenants (name, subscription_status) VALUES
  ('Glamtica Default Tenant', 'active')
  ON CONFLICT (name) DO NOTHING
  RETURNING id INTO default_tenant_id;

  -- If tenant already exists, get its ID
  SELECT id INTO default_tenant_id FROM public.tenants WHERE name = 'Glamtica Default Tenant';

  -- Insert default branch for the default tenant
  INSERT INTO public.branches (tenant_id, name, address) VALUES
  (default_tenant_id, 'Main Branch', '123 Main St, Anytown')
  ON CONFLICT (tenant_id, name) DO NOTHING
  RETURNING id INTO default_branch_id;

  -- If branch already exists, get its ID
  SELECT id INTO default_branch_id FROM public.branches WHERE tenant_id = default_tenant_id AND name = 'Main Branch';

  -- Insert initial super_admin user (no tenant_id, no branch_id)
  INSERT INTO public.users (email, password_hash, role_id, is_active) VALUES
  ('superadmin@glamtica.com', 'hashed_super_admin_password', super_admin_role_id, TRUE)
  ON CONFLICT (email) DO NOTHING;

  -- Insert initial tenant_super_admin user for the default tenant (no branch_id)
  INSERT INTO public.users (email, password_hash, role_id, tenant_id, is_active) VALUES
  ('tenantadmin@glamtica.com', 'hashed_tenant_admin_password', tenant_super_admin_role_id, default_tenant_id, TRUE)
  ON CONFLICT (email) DO NOTHING;

  -- Insert initial tenant_admin user for the default branch
  INSERT INTO public.users (email, password_hash, role_id, tenant_id, branch_id, is_active) VALUES
  ('branchadmin@glamtica.com', 'hashed_branch_admin_password', tenant_admin_role_id, default_tenant_id, default_branch_id, TRUE)
  ON CONFLICT (email) DO NOTHING;

  -- Insert initial tenant_user for the default branch
  INSERT INTO public.users (email, password_hash, role_id, tenant_id, branch_id, is_active) VALUES
  ('user@glamtica.com', 'hashed_user_password', tenant_user_role_id, default_tenant_id, default_branch_id, TRUE)
  ON CONFLICT (email) DO NOTHING;

END $$;


-- 4. Populate tenant_id and branch_id for existing data

DO $$ -- New DO block for updates and FKs
DECLARE
  default_tenant_id UUID;
  default_branch_id UUID;
BEGIN
  SELECT id INTO default_tenant_id FROM public.tenants WHERE name = 'Glamtica Default Tenant';
  SELECT id INTO default_branch_id FROM public.branches WHERE tenant_id = default_tenant_id AND name = 'Main Branch';

  -- Update existing data with default tenant_id and branch_id
  -- Ensure columns exist before updating
  EXECUTE format('UPDATE public.clients SET tenant_id = COALESCE(tenant_id, %L), branch_id = COALESCE(branch_id, %L) WHERE tenant_id IS NULL OR branch_id IS NULL;', default_tenant_id, default_branch_id);
  EXECUTE format('UPDATE public.stylists SET tenant_id = COALESCE(tenant_id, %L), branch_id = COALESCE(branch_id, %L) WHERE tenant_id IS NULL OR branch_id IS NULL;', default_tenant_id, default_branch_id);
  EXECUTE format('UPDATE public.services SET tenant_id = COALESCE(tenant_id, %L), branch_id = COALESCE(branch_id, %L) WHERE tenant_id IS NULL OR branch_id IS NULL;', default_tenant_id, default_branch_id);
  EXECUTE format('UPDATE public.products SET tenant_id = COALESCE(tenant_id, %L), branch_id = COALESCE(branch_id, %L) WHERE tenant_id IS NULL OR branch_id IS NULL;', default_tenant_id, default_branch_id);
  EXECUTE format('UPDATE public.attentions SET tenant_id = COALESCE(tenant_id, %L), branch_id = COALESCE(branch_id, %L) WHERE tenant_id IS NULL OR branch_id IS NULL;', default_tenant_id, default_branch_id);
  EXECUTE format('UPDATE public.purchases SET tenant_id = COALESCE(tenant_id, %L), branch_id = COALESCE(branch_id, %L) WHERE tenant_id IS NULL OR branch_id IS NULL;', default_tenant_id, default_branch_id);
  EXECUTE format('UPDATE public.languages SET tenant_id = COALESCE(tenant_id, %L) WHERE tenant_id IS NULL;', default_tenant_id);
  EXECUTE format('UPDATE public.translations SET tenant_id = COALESCE(tenant_id, %L) WHERE tenant_id IS NULL;', default_tenant_id);
  EXECUTE format('UPDATE public.brands SET tenant_id = COALESCE(tenant_id, %L) WHERE tenant_id IS NULL;', default_tenant_id);
  EXECUTE format('UPDATE public.suppliers SET tenant_id = COALESCE(tenant_id, %L) WHERE tenant_id IS NULL;', default_tenant_id);
  EXECUTE format('UPDATE public.schedule_templates SET tenant_id = COALESCE(tenant_id, %L) WHERE tenant_id IS NULL;', default_tenant_id);
  EXECUTE format('UPDATE public.stylist_schedules SET tenant_id = COALESCE(tenant_id, %L), branch_id = COALESCE(branch_id, %L) WHERE tenant_id IS NULL OR branch_id IS NULL;', default_tenant_id, default_branch_id);
  EXECUTE format('UPDATE public.stylist_time_off SET tenant_id = COALESCE(tenant_id, %L), branch_id = COALESCE(branch_id, %L) WHERE tenant_id IS NULL OR branch_id IS NULL;', default_tenant_id, default_branch_id);
  EXECUTE format('UPDATE public.service_categories SET tenant_id = COALESCE(tenant_id, %L) WHERE tenant_id IS NULL;', default_tenant_id);
  EXECUTE format('UPDATE public.attention_service_products SET tenant_id = COALESCE(tenant_id, %L), branch_id = COALESCE(branch_id, %L) WHERE tenant_id IS NULL OR branch_id IS NULL;', default_tenant_id, default_branch_id);
  EXECUTE format('UPDATE public.attention_products SET tenant_id = COALESCE(tenant_id, %L), branch_id = COALESCE(branch_id, %L) WHERE tenant_id IS NULL OR branch_id IS NULL;', default_tenant_id, default_branch_id);
  EXECUTE format('UPDATE public.service_evidence SET tenant_id = COALESCE(tenant_id, %L), branch_id = COALESCE(branch_id, %L) WHERE tenant_id IS NULL OR branch_id IS NULL;', default_tenant_id, default_branch_id);
  EXECUTE format('UPDATE public.service_sessions SET tenant_id = COALESCE(tenant_id, %L), branch_id = COALESCE(branch_id, %L) WHERE tenant_id IS NULL OR branch_id IS NULL;', default_tenant_id, default_branch_id);
  EXECUTE format('UPDATE public.attention_services SET tenant_id = COALESCE(tenant_id, %L), branch_id = COALESCE(branch_id, %L) WHERE tenant_id IS NULL OR branch_id IS NULL;', default_tenant_id, default_branch_id);
  EXECUTE format('UPDATE public.extra_service_sessions SET tenant_id = COALESCE(tenant_id, %L), branch_id = COALESCE(branch_id, %L) WHERE tenant_id IS NULL OR branch_id IS NULL;', default_tenant_id, default_branch_id);
  EXECUTE format('UPDATE public.appointment_evidence SET tenant_id = COALESCE(tenant_id, %L), branch_id = COALESCE(branch_id, %L) WHERE tenant_id IS NULL OR branch_id IS NULL;', default_tenant_id, default_branch_id);
  EXECUTE format('UPDATE public.appointment_products SET tenant_id = COALESCE(tenant_id, %L), branch_id = COALESCE(branch_id, %L) WHERE tenant_id IS NULL OR branch_id IS NULL;', default_tenant_id, default_branch_id);
  EXECUTE format('UPDATE public.appointment_extra_services SET tenant_id = COALESCE(tenant_id, %L), branch_id = COALESCE(branch_id, %L) WHERE tenant_id IS NULL OR branch_id IS NULL;', default_tenant_id, default_branch_id);
  EXECUTE format('UPDATE public.appointment_sessions SET tenant_id = COALESCE(tenant_id, %L), branch_id = COALESCE(branch_id, %L) WHERE tenant_id IS NULL OR branch_id IS NULL;', default_tenant_id, default_branch_id);
  EXECUTE format('UPDATE public.appointments SET tenant_id = COALESCE(tenant_id, %L), branch_id = COALESCE(branch_id, %L) WHERE tenant_id IS NULL OR branch_id IS NULL;', default_tenant_id, default_branch_id);
  EXECUTE format('UPDATE public.purchase_items SET tenant_id = COALESCE(tenant_id, %L), branch_id = COALESCE(branch_id, %L) WHERE tenant_id IS NULL OR branch_id IS NULL;', default_tenant_id, default_branch_id);
  EXECUTE format('UPDATE public.product_stylist_commissions SET tenant_id = COALESCE(tenant_id, %L), branch_id = COALESCE(branch_id, %L) WHERE tenant_id IS NULL OR branch_id IS NULL;', default_tenant_id, default_branch_id);
  EXECUTE format('UPDATE public.supplier_products SET tenant_id = COALESCE(tenant_id, %L), branch_id = COALESCE(branch_id, %L) WHERE tenant_id IS NULL OR branch_id IS NULL;', default_tenant_id, default_branch_id);
  EXECUTE format('UPDATE public.service_stylist_commissions SET tenant_id = COALESCE(tenant_id, %L), branch_id = COALESCE(branch_id, %L) WHERE tenant_id IS NULL OR branch_id IS NULL;', default_tenant_id, default_branch_id);
  EXECUTE format('UPDATE public.settings SET tenant_id = COALESCE(tenant_id, %L) WHERE tenant_id IS NULL;', default_tenant_id);

  -- Add Foreign Key Constraints and NOT NULL constraints
  -- Use ALTER TABLE ADD CONSTRAINT IF NOT EXISTS to avoid errors if already exists
  -- Use ALTER COLUMN SET NOT NULL in a separate block to ensure updates are done first

  -- FKs
  BEGIN EXECUTE 'ALTER TABLE public.clients ADD CONSTRAINT fk_clients_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;'; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN EXECUTE 'ALTER TABLE public.clients ADD CONSTRAINT fk_clients_branch FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;'; EXCEPTION WHEN duplicate_object THEN NULL; END;

  BEGIN EXECUTE 'ALTER TABLE public.stylists ADD CONSTRAINT fk_stylists_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;'; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN EXECUTE 'ALTER TABLE public.stylists ADD CONSTRAINT fk_stylists_branch FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;'; EXCEPTION WHEN duplicate_object THEN NULL; END;

  BEGIN EXECUTE 'ALTER TABLE public.services ADD CONSTRAINT fk_services_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;'; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN EXECUTE 'ALTER TABLE public.services ADD CONSTRAINT fk_services_branch FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;'; EXCEPTION WHEN duplicate_object THEN NULL; END;

  BEGIN EXECUTE 'ALTER TABLE public.products ADD CONSTRAINT fk_products_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;'; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN EXECUTE 'ALTER TABLE public.products ADD CONSTRAINT fk_products_branch FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;'; EXCEPTION WHEN duplicate_object THEN NULL; END;

  BEGIN EXECUTE 'ALTER TABLE public.attentions ADD CONSTRAINT fk_attentions_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;'; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN EXECUTE 'ALTER TABLE public.attentions ADD CONSTRAINT fk_attentions_branch FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;'; EXCEPTION WHEN duplicate_object THEN NULL; END;

  BEGIN EXECUTE 'ALTER TABLE public.purchases ADD CONSTRAINT fk_purchases_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;'; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN EXECUTE 'ALTER TABLE public.purchases ADD CONSTRAINT fk_purchases_branch FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;'; EXCEPTION WHEN duplicate_object THEN NULL; END;

  BEGIN EXECUTE 'ALTER TABLE public.languages ADD CONSTRAINT fk_languages_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;'; EXCEPTION WHEN duplicate_object THEN NULL; END;

  BEGIN EXECUTE 'ALTER TABLE public.translations ADD CONSTRAINT fk_translations_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;'; EXCEPTION WHEN duplicate_object THEN NULL; END;

  BEGIN EXECUTE 'ALTER TABLE public.brands ADD CONSTRAINT fk_brands_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;'; EXCEPTION WHEN duplicate_object THEN NULL; END;

  BEGIN EXECUTE 'ALTER TABLE public.suppliers ADD CONSTRAINT fk_suppliers_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;'; EXCEPTION WHEN duplicate_object THEN NULL; END;

  BEGIN EXECUTE 'ALTER TABLE public.schedule_templates ADD CONSTRAINT fk_schedule_templates_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;'; EXCEPTION WHEN duplicate_object THEN NULL; END;

  BEGIN EXECUTE 'ALTER TABLE public.stylist_schedules ADD CONSTRAINT fk_stylist_schedules_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;'; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN EXECUTE 'ALTER TABLE public.stylist_schedules ADD CONSTRAINT fk_stylist_schedules_branch FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;'; EXCEPTION WHEN duplicate_object THEN NULL; END;

  BEGIN EXECUTE 'ALTER TABLE public.stylist_time_off ADD CONSTRAINT fk_stylist_time_off_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;'; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN EXECUTE 'ALTER TABLE public.stylist_time_off ADD CONSTRAINT fk_stylist_time_off_branch FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;'; EXCEPTION WHEN duplicate_object THEN NULL; END;

  BEGIN EXECUTE 'ALTER TABLE public.service_categories ADD CONSTRAINT fk_service_categories_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;'; EXCEPTION WHEN duplicate_object THEN NULL; END;

  BEGIN EXECUTE 'ALTER TABLE public.attention_service_products ADD CONSTRAINT fk_attention_service_products_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;'; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN EXECUTE 'ALTER TABLE public.attention_service_products ADD CONSTRAINT fk_attention_service_products_branch FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;'; EXCEPTION WHEN duplicate_object THEN NULL; END;

  BEGIN EXECUTE 'ALTER TABLE public.attention_products ADD CONSTRAINT fk_attention_products_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;'; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN EXECUTE 'ALTER TABLE public.attention_products ADD CONSTRAINT fk_attention_products_branch FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;'; EXCEPTION WHEN duplicate_object THEN NULL; END;

  BEGIN EXECUTE 'ALTER TABLE public.service_evidence ADD CONSTRAINT fk_service_evidence_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;'; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN EXECUTE 'ALTER TABLE public.service_evidence ADD CONSTRAINT fk_service_evidence_branch FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;'; EXCEPTION WHEN duplicate_object THEN NULL; END;

  BEGIN EXECUTE 'ALTER TABLE public.service_sessions ADD CONSTRAINT fk_service_sessions_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;'; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN EXECUTE 'ALTER TABLE public.service_sessions ADD CONSTRAINT fk_service_sessions_branch FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;'; EXCEPTION WHEN duplicate_object THEN NULL; END;

  BEGIN EXECUTE 'ALTER TABLE public.attention_services ADD CONSTRAINT fk_attention_services_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;'; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN EXECUTE 'ALTER TABLE public.attention_services ADD CONSTRAINT fk_attention_services_branch FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;'; EXCEPTION WHEN duplicate_object THEN NULL; END;

  BEGIN EXECUTE 'ALTER TABLE public.extra_service_sessions ADD CONSTRAINT fk_extra_service_sessions_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;'; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN EXECUTE 'ALTER TABLE public.extra_service_sessions ADD CONSTRAINT fk_extra_service_sessions_branch FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;'; EXCEPTION WHEN duplicate_object THEN NULL; END;

  BEGIN EXECUTE 'ALTER TABLE public.appointment_evidence ADD CONSTRAINT fk_appointment_evidence_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;'; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN EXECUTE 'ALTER TABLE public.appointment_evidence ADD CONSTRAINT fk_appointment_evidence_branch FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;'; EXCEPTION WHEN duplicate_object THEN NULL; END;

  BEGIN EXECUTE 'ALTER TABLE public.appointment_products ADD CONSTRAINT fk_appointment_products_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;'; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN EXECUTE 'ALTER TABLE public.appointment_products ADD CONSTRAINT fk_appointment_products_branch FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;'; EXCEPTION WHEN duplicate_object THEN NULL; END;

  BEGIN EXECUTE 'ALTER TABLE public.appointment_extra_services ADD CONSTRAINT fk_appointment_extra_services_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;'; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN EXECUTE 'ALTER TABLE public.appointment_extra_services ADD CONSTRAINT fk_appointment_extra_services_branch FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;'; EXCEPTION WHEN duplicate_object THEN NULL; END;

  BEGIN EXECUTE 'ALTER TABLE public.appointment_sessions ADD CONSTRAINT fk_appointment_sessions_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;'; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN EXECUTE 'ALTER TABLE public.appointment_sessions ADD CONSTRAINT fk_appointment_sessions_branch FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;'; EXCEPTION WHEN duplicate_object THEN NULL; END;

  BEGIN EXECUTE 'ALTER TABLE public.appointments ADD CONSTRAINT fk_appointments_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;'; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN EXECUTE 'ALTER TABLE public.appointments ADD CONSTRAINT fk_appointments_branch FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;'; EXCEPTION WHEN duplicate_object THEN NULL; END;

  BEGIN EXECUTE 'ALTER TABLE public.purchase_items ADD CONSTRAINT fk_purchase_items_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;'; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN EXECUTE 'ALTER TABLE public.purchase_items ADD CONSTRAINT fk_purchase_items_branch FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;'; EXCEPTION WHEN duplicate_object THEN NULL; END;

  BEGIN EXECUTE 'ALTER TABLE public.product_stylist_commissions ADD CONSTRAINT fk_product_stylist_commissions_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;'; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN EXECUTE 'ALTER TABLE public.product_stylist_commissions ADD CONSTRAINT fk_product_stylist_commissions_branch FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;'; EXCEPTION WHEN duplicate_object THEN NULL; END;

  BEGIN EXECUTE 'ALTER TABLE public.supplier_products ADD CONSTRAINT fk_supplier_products_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;'; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN EXECUTE 'ALTER TABLE public.supplier_products ADD CONSTRAINT fk_supplier_products_branch FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;'; EXCEPTION WHEN duplicate_object THEN NULL; END;

  BEGIN EXECUTE 'ALTER TABLE public.service_stylist_commissions ADD CONSTRAINT fk_service_stylist_commissions_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;'; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN EXECUTE 'ALTER TABLE public.service_stylist_commissions ADD CONSTRAINT fk_service_stylist_commissions_branch FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;'; EXCEPTION WHEN duplicate_object THEN NULL; END;

  BEGIN EXECUTE 'ALTER TABLE public.settings ADD CONSTRAINT fk_settings_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;'; EXCEPTION WHEN duplicate_object THEN NULL; END;

  -- NOT NULL constraints
  BEGIN EXECUTE 'ALTER TABLE public.clients ALTER COLUMN tenant_id SET NOT NULL;'; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN EXECUTE 'ALTER TABLE public.clients ALTER COLUMN branch_id SET NOT NULL;'; EXCEPTION WHEN OTHERS THEN NULL; END;

  BEGIN EXECUTE 'ALTER TABLE public.stylists ALTER COLUMN tenant_id SET NOT NULL;'; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN EXECUTE 'ALTER TABLE public.stylists ALTER COLUMN branch_id SET NOT NULL;'; EXCEPTION WHEN OTHERS THEN NULL; END;

  BEGIN EXECUTE 'ALTER TABLE public.services ALTER COLUMN tenant_id SET NOT NULL;'; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN EXECUTE 'ALTER TABLE public.services ALTER COLUMN branch_id SET NOT NULL;'; EXCEPTION WHEN OTHERS THEN NULL; END;

  BEGIN EXECUTE 'ALTER TABLE public.products ALTER COLUMN tenant_id SET NOT NULL;'; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN EXECUTE 'ALTER TABLE public.products ALTER COLUMN branch_id SET NOT NULL;'; EXCEPTION WHEN OTHERS THEN NULL; END;

  BEGIN EXECUTE 'ALTER TABLE public.attentions ALTER COLUMN tenant_id SET NOT NULL;'; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN EXECUTE 'ALTER TABLE public.attentions ALTER COLUMN branch_id SET NOT NULL;'; EXCEPTION WHEN OTHERS THEN NULL; END;

  BEGIN EXECUTE 'ALTER TABLE public.purchases ALTER COLUMN tenant_id SET NOT NULL;'; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN EXECUTE 'ALTER TABLE public.purchases ALTER COLUMN branch_id SET NOT NULL;'; EXCEPTION WHEN OTHERS THEN NULL; END;

  BEGIN EXECUTE 'ALTER TABLE public.languages ALTER COLUMN tenant_id SET NOT NULL;'; EXCEPTION WHEN OTHERS THEN NULL; END;

  BEGIN EXECUTE 'ALTER TABLE public.translations ALTER COLUMN tenant_id SET NOT NULL;'; EXCEPTION WHEN OTHERS THEN NULL; END;

  BEGIN EXECUTE 'ALTER TABLE public.brands ALTER COLUMN tenant_id SET NOT NULL;'; EXCEPTION WHEN OTHERS THEN NULL; END;

  BEGIN EXECUTE 'ALTER TABLE public.suppliers ALTER COLUMN tenant_id SET NOT NULL;'; EXCEPTION WHEN OTHERS THEN NULL; END;

  BEGIN EXECUTE 'ALTER TABLE public.schedule_templates ALTER COLUMN tenant_id SET NOT NULL;'; EXCEPTION WHEN OTHERS THEN NULL; END;

  BEGIN EXECUTE 'ALTER TABLE public.stylist_schedules ALTER COLUMN tenant_id SET NOT NULL;'; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN EXECUTE 'ALTER TABLE public.stylist_schedules ALTER COLUMN branch_id SET NOT NULL;'; EXCEPTION WHEN OTHERS THEN NULL; END;

  BEGIN EXECUTE 'ALTER TABLE public.stylist_time_off ALTER COLUMN tenant_id SET NOT NULL;'; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN EXECUTE 'ALTER TABLE public.stylist_time_off ALTER COLUMN branch_id SET NOT NULL;'; EXCEPTION WHEN OTHERS THEN NULL; END;

  BEGIN EXECUTE 'ALTER TABLE public.service_categories ALTER COLUMN tenant_id SET NOT NULL;'; EXCEPTION WHEN OTHERS THEN NULL; END;

  BEGIN EXECUTE 'ALTER TABLE public.attention_service_products ALTER COLUMN tenant_id SET NOT NULL;'; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN EXECUTE 'ALTER TABLE public.attention_service_products ALTER COLUMN branch_id SET NOT NULL;'; EXCEPTION WHEN OTHERS THEN NULL; END;

  BEGIN EXECUTE 'ALTER TABLE public.attention_products ALTER COLUMN tenant_id SET NOT NULL;'; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN EXECUTE 'ALTER TABLE public.attention_products ALTER COLUMN branch_id SET NOT NULL;'; EXCEPTION WHEN OTHERS THEN NULL; END;

  BEGIN EXECUTE 'ALTER TABLE public.service_evidence ALTER COLUMN tenant_id SET NOT NULL;'; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN EXECUTE 'ALTER TABLE public.service_evidence ALTER COLUMN branch_id SET NOT NULL;'; EXCEPTION WHEN OTHERS THEN NULL; END;

  BEGIN EXECUTE 'ALTER TABLE public.service_sessions ALTER COLUMN tenant_id SET NOT NULL;'; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN EXECUTE 'ALTER TABLE public.service_sessions ALTER COLUMN branch_id SET NOT NULL;'; EXCEPTION WHEN OTHERS THEN NULL; END;

  BEGIN EXECUTE 'ALTER TABLE public.attention_services ALTER COLUMN tenant_id SET NOT NULL;'; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN EXECUTE 'ALTER TABLE public.attention_services ALTER COLUMN branch_id SET NOT NULL;'; EXCEPTION WHEN OTHERS THEN NULL; END;

  BEGIN EXECUTE 'ALTER TABLE public.extra_service_sessions ALTER COLUMN tenant_id SET NOT NULL;'; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN EXECUTE 'ALTER TABLE public.extra_service_sessions ALTER COLUMN branch_id SET NOT NULL;'; EXCEPTION WHEN OTHERS THEN NULL; END;

  BEGIN EXECUTE 'ALTER TABLE public.appointment_evidence ALTER COLUMN tenant_id SET NOT NULL;'; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN EXECUTE 'ALTER TABLE public.appointment_evidence ALTER COLUMN branch_id SET NOT NULL;'; EXCEPTION WHEN OTHERS THEN NULL; END;

  BEGIN EXECUTE 'ALTER TABLE public.appointment_products ALTER COLUMN tenant_id SET NOT NULL;'; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN EXECUTE 'ALTER TABLE public.appointment_products ALTER COLUMN branch_id SET NOT NULL;'; EXCEPTION WHEN OTHERS THEN NULL; END;

  BEGIN EXECUTE 'ALTER TABLE public.appointment_extra_services ALTER COLUMN tenant_id SET NOT NULL;'; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN EXECUTE 'ALTER TABLE public.appointment_extra_services ALTER COLUMN branch_id SET NOT NULL;'; EXCEPTION WHEN OTHERS THEN NULL; END;

  BEGIN EXECUTE 'ALTER TABLE public.appointment_sessions ALTER COLUMN tenant_id SET NOT NULL;'; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN EXECUTE 'ALTER TABLE public.appointment_sessions ALTER COLUMN branch_id SET NOT NULL;'; EXCEPTION WHEN OTHERS THEN NULL; END;

  BEGIN EXECUTE 'ALTER TABLE public.appointments ALTER COLUMN tenant_id SET NOT NULL;'; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN EXECUTE 'ALTER TABLE public.appointments ALTER COLUMN branch_id SET NOT NULL;'; EXCEPTION WHEN OTHERS THEN NULL; END;

  BEGIN EXECUTE 'ALTER TABLE public.purchase_items ALTER COLUMN tenant_id SET NOT NULL;'; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN EXECUTE 'ALTER TABLE public.purchase_items ALTER COLUMN branch_id SET NOT NULL;'; EXCEPTION WHEN OTHERS THEN NULL; END;

  BEGIN EXECUTE 'ALTER TABLE public.product_stylist_commissions ALTER COLUMN tenant_id SET NOT NULL;'; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN EXECUTE 'ALTER TABLE public.product_stylist_commissions ALTER COLUMN branch_id SET NOT NULL;'; EXCEPTION WHEN OTHERS THEN NULL; END;

  BEGIN EXECUTE 'ALTER TABLE public.supplier_products ALTER COLUMN tenant_id SET NOT NULL;'; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN EXECUTE 'ALTER TABLE public.supplier_products ALTER COLUMN branch_id SET NOT NULL;'; EXCEPTION WHEN OTHERS THEN NULL; END;

  BEGIN EXECUTE 'ALTER TABLE public.service_stylist_commissions ALTER COLUMN tenant_id SET NOT NULL;'; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN EXECUTE 'ALTER TABLE public.service_stylist_commissions ALTER COLUMN branch_id SET NOT NULL;'; EXCEPTION WHEN OTHERS THEN NULL; END;

  BEGIN EXECUTE 'ALTER TABLE public.settings ALTER COLUMN tenant_id SET NOT NULL;'; EXCEPTION WHEN duplicate_object THEN NULL; END;

END $$;


-- 5. Implement RLS functions and policies

-- Functions to get current session variables
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS UUID AS $$
  SELECT NULLIF(current_setting('app.current_user_id', TRUE), '')::UUID;
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID AS $$
  SELECT NULLIF(current_setting('app.current_tenant_id', TRUE), '')::UUID;
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION get_current_branch_id()
RETURNS UUID AS $$
  SELECT NULLIF(current_setting('app.current_branch_id', TRUE), '')::UUID;
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION get_current_role_name()
RETURNS TEXT AS $$
  SELECT NULLIF(current_setting('app.current_role_name', TRUE), '');
$$ LANGUAGE SQL STABLE;

-- Policy for super_admin (can access everything)
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT get_current_role_name() = 'super_admin';
$$ LANGUAGE SQL STABLE;

-- Policy for tenant_super_admin (can access all data within their tenant)
CREATE OR REPLACE FUNCTION is_tenant_super_admin()
RETURNS BOOLEAN AS $$
  SELECT get_current_role_name() = 'tenant_super_admin' AND get_current_tenant_id() IS NOT NULL;
$$ LANGUAGE SQL STABLE;

-- Policy for tenant_admin (can access all data within their tenant and branch)
CREATE OR REPLACE FUNCTION is_tenant_admin()
RETURNS BOOLEAN AS $$
  SELECT get_current_role_name() = 'tenant_admin' AND get_current_tenant_id() IS NOT NULL AND get_current_branch_id() IS NOT NULL;
$$ LANGUAGE SQL STABLE;

-- Policy for tenant_user (can access data within their tenant and branch)
CREATE OR REPLACE FUNCTION is_tenant_user()
RETURNS BOOLEAN AS $$
  SELECT get_current_role_name() = 'tenant_user' AND get_current_tenant_id() IS NOT NULL AND get_current_branch_id() IS NOT NULL;
$$ LANGUAGE SQL STABLE;

-- Generic RLS policy function for tenant/branch scoped tables
CREATE OR REPLACE FUNCTION tenant_branch_rls_policy(table_tenant_id UUID, table_branch_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN is_super_admin() OR
         (is_tenant_super_admin() AND table_tenant_id = get_current_tenant_id()) OR
         (is_tenant_admin() AND table_tenant_id = get_current_tenant_id() AND table_branch_id = get_current_branch_id()) OR
         (is_tenant_user() AND table_tenant_id = get_current_tenant_id() AND table_branch_id = get_current_branch_id());
END;
$$ LANGUAGE plpgsql STABLE;

-- RLS policy function for tenant-only scoped tables
CREATE OR REPLACE FUNCTION tenant_only_rls_policy(table_tenant_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN is_super_admin() OR
         (is_tenant_super_admin() AND table_tenant_id = get_current_tenant_id()) OR
         (is_tenant_admin() AND table_tenant_id = get_current_tenant_id()) OR
         (is_tenant_user() AND table_tenant_id = get_current_tenant_id());
END;
$$ LANGUAGE plpgsql STABLE;

-- Apply RLS to all tables
DO $$
DECLARE
  t TEXT;
  table_names TEXT[] := ARRAY[
    'clients', 'stylists', 'services', 'products', 'attentions', 'purchases',
    'languages', 'translations', 'brands', 'suppliers', 'schedule_templates',
    'stylist_schedules', 'stylist_time_off', 'service_categories',
    'attention_service_products', 'attention_products', 'service_evidence',
    'service_sessions', 'attention_services', 'extra_service_sessions',
    'appointment_evidence', 'appointment_products', 'appointment_extra_services',
    'appointment_sessions', 'appointments', 'purchase_items',
    'product_stylist_commissions', 'supplier_products', 'service_stylist_commissions',
    'settings' -- settings is also included here
  ];
  tenant_only_tables TEXT[] := ARRAY['settings', 'languages', 'translations', 'brands', 'suppliers', 'schedule_templates', 'service_categories'];
BEGIN
  FOREACH t IN ARRAY table_names LOOP
    -- Enable RLS
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);

    -- Drop existing policies to avoid conflicts
    EXECUTE format('DROP POLICY IF EXISTS "tenant_branch_policy_%I" ON public.%I;', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "super_admin_policy_%I" ON public.%I;', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "tenant_only_policy_%I" ON public.%I;', t, t);

    -- Add policies
    -- Super Admin Policy (can see/do everything)
    EXECUTE format('CREATE POLICY "super_admin_policy_%I" ON public.%I FOR ALL TO public USING (is_super_admin());', t, t);

    -- Apply tenant-only policy or tenant-branch policy based on table name
    IF t = ANY(tenant_only_tables) THEN
      EXECUTE format('CREATE POLICY "tenant_only_policy_%I" ON public.%I FOR ALL TO public USING (tenant_only_rls_policy(tenant_id));', t, t);
    ELSE
      EXECUTE format('CREATE POLICY "tenant_branch_policy_%I" ON public.%I FOR ALL TO public USING (tenant_branch_rls_policy(tenant_id, branch_id));', t, t);
    END IF;

  END LOOP;

  -- Special RLS for users table
  EXECUTE 'DROP POLICY IF EXISTS "users_rls_policy" ON public.users;';
  EXECUTE 'CREATE POLICY "users_rls_policy" ON public.users FOR ALL TO public USING (
    is_super_admin() OR
    (is_tenant_super_admin() AND tenant_id = get_current_tenant_id()) OR
    (is_tenant_admin() AND tenant_id = get_current_tenant_id() AND branch_id = get_current_branch_id()) OR
    (is_tenant_user() AND id = get_current_user_id()) -- Users can only see their own profile
  ) WITH CHECK (
    is_super_admin() OR
    (is_tenant_super_admin() AND tenant_id = get_current_tenant_id()) OR
    (is_tenant_admin() AND tenant_id = get_current_tenant_id() AND branch_id = get_current_branch_id()) OR
    (is_tenant_user() AND id = get_current_user_id())
  );';

END $$;

-- Trigger for users table to enforce role-based tenant/branch assignment
CREATE OR REPLACE FUNCTION validate_user_role_assignment()
RETURNS TRIGGER AS $$
DECLARE
  role_name TEXT;
BEGIN
  SELECT name INTO role_name FROM public.roles WHERE id = NEW.role_id;

  IF role_name = 'super_admin' THEN
    IF NEW.tenant_id IS NOT NULL OR NEW.branch_id IS NOT NULL THEN
      RAISE EXCEPTION 'Super admin users cannot have tenant_id or branch_id assigned.';
    END IF;
  ELSIF role_name = 'tenant_super_admin' THEN
    IF NEW.tenant_id IS NULL THEN
      RAISE EXCEPTION 'Tenant super admin users must have a tenant_id.';
    END IF;
    IF NEW.branch_id IS NOT NULL THEN
      RAISE EXCEPTION 'Tenant super admin users cannot have a branch_id.';
    END IF;
  ELSIF role_name IN ('tenant_admin', 'tenant_user') THEN
    IF NEW.tenant_id IS NULL OR NEW.branch_id IS NULL THEN
      RAISE EXCEPTION 'Tenant admin and tenant user roles must have both tenant_id and branch_id assigned.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_validate_user_role_assignment ON public.users;
CREATE TRIGGER trg_validate_user_role_assignment
BEFORE INSERT OR UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION validate_user_role_assignment();

-- Add updated_at triggers for new tables
CREATE OR REPLACE TRIGGER trigger_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trigger_branches_updated_at
  BEFORE UPDATE ON public.branches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trigger_roles_updated_at
  BEFORE UPDATE ON public.roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trigger_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

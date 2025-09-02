-- Migration: 20250821000025_update_user_schedules_table.sql
-- Description: Adds tenant_id and branch_id to the user_schedules table to make it multi-tenant.

ALTER TABLE public.user_schedules
ADD COLUMN tenant_id UUID,
ADD COLUMN branch_id UUID;

-- Note: We are not setting NOT NULL constraint on tenant_id yet,
-- because the table might contain existing data. We will need a separate
-- script to backfill the tenant_id for existing rows.

ALTER TABLE public.user_schedules
ADD CONSTRAINT user_schedules_tenant_id_fkey
FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

ALTER TABLE public.user_schedules
ADD CONSTRAINT user_schedules_branch_id_fkey
FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;

-- Add indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_user_schedules_tenant_id ON public.user_schedules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_schedules_branch_id ON public.user_schedules(branch_id);

-- Update the unique constraint to include tenant_id and branch_id
ALTER TABLE public.user_schedules
DROP CONSTRAINT IF EXISTS user_schedules_user_id_day_of_week_key;

ALTER TABLE public.user_schedules
ADD CONSTRAINT user_schedules_user_day_tenant_branch_unique
UNIQUE (user_id, day_of_week, tenant_id, branch_id);

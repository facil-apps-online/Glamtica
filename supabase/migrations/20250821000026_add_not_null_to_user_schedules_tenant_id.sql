-- Migration: 20250821000026_add_not_null_to_user_schedules_tenant_id.sql
-- Description: Adds NOT NULL constraint to the tenant_id column in the user_schedules table.

ALTER TABLE public.user_schedules
ALTER COLUMN tenant_id SET NOT NULL;

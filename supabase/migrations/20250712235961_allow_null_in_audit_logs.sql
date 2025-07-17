-- Allow NULL for tenant_id and branch_id in audit_logs table
ALTER TABLE public.audit_logs ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE public.audit_logs ALTER COLUMN branch_id DROP NOT NULL;

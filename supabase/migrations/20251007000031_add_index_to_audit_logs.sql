-- Adds a composite index to the audit_logs table to optimize queries for fetching a specific resource's history.

CREATE INDEX idx_audit_logs_resource ON public.audit_logs (tenant_id, object_type, object_id);

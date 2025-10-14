
-- supabase/migrations/20251007000048_create_document_types_table.sql

CREATE TABLE public.document_types (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    name text NOT NULL,
    abbreviation text,
    applies_to text[] NOT NULL,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT document_types_pkey PRIMARY KEY (id),
    CONSTRAINT document_types_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

ALTER TABLE public.document_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to read document types of their own tenant"
ON public.document_types FOR SELECT
TO authenticated
USING (tenant_id = (SELECT current_setting('app.tenant_id', true)::uuid));

CREATE POLICY "Allow super admins to manage document types of their own tenant"
ON public.document_types FOR ALL
TO authenticated
USING (
    tenant_id = (SELECT current_setting('app.tenant_id', true)::uuid) AND
    is_tenant_super_admin()
)
WITH CHECK (
    tenant_id = (SELECT current_setting('app.tenant_id', true)::uuid) AND
    is_tenant_super_admin()
);

COMMENT ON TABLE public.document_types IS 'Stores custom document types for clients, suppliers, etc., configurable by tenant.';

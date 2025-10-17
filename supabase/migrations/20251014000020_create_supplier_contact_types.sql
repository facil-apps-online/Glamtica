CREATE TABLE public.supplier_contact_types (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    name character varying NOT NULL,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT supplier_contact_types_pkey PRIMARY KEY (id),
    CONSTRAINT supplier_contact_types_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

ALTER TABLE public.supplier_contact_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated users" ON public.supplier_contact_types FOR ALL
TO authenticated
USING (tenant_id = (SELECT current_setting('app.tenant_id', TRUE)::uuid))
WITH CHECK (tenant_id = (SELECT current_setting('app.tenant_id', TRUE)::uuid));
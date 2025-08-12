-- Add tenant_id column to client_document_instances
ALTER TABLE public.client_document_instances
ADD COLUMN tenant_id UUID;

-- Update existing records with a default tenant_id
DO $$
DECLARE
    default_tenant_id UUID;
BEGIN
    -- Attempt to find an existing tenant_id, e.g., the first one or a specific superadmin tenant
    SELECT id INTO default_tenant_id FROM public.tenants LIMIT 1;

    IF default_tenant_id IS NOT NULL THEN
        UPDATE public.client_document_instances
        SET tenant_id = default_tenant_id
        WHERE tenant_id IS NULL;
    ELSE
        RAISE WARNING 'No default tenant_id found. client_document_instances with NULL tenant_id might remain.';
    END IF;
END $$;

-- Set tenant_id column as NOT NULL
ALTER TABLE public.client_document_instances
ALTER COLUMN tenant_id SET NOT NULL;

-- Add foreign key constraint
ALTER TABLE public.client_document_instances
ADD CONSTRAINT fk_client_document_instances_tenant
FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Update RLS policy for client_document_instances
DROP POLICY IF EXISTS "client_document_instances_rls_policy" ON public.client_document_instances;
CREATE POLICY client_document_instances_rls_policy
ON public.client_document_instances FOR ALL
USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- Optional: Re-enable RLS if it was disabled
ALTER TABLE public.client_document_instances ENABLE ROW LEVEL SECURITY;
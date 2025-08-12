-- Add tenant_id column to client_consent_records
ALTER TABLE public.client_consent_records
ADD COLUMN tenant_id UUID;

-- Update existing records with a default tenant_id
-- IMPORTANT: Replace 'YOUR_DEFAULT_TENANT_ID' with an actual tenant_id from your 'tenants' table.
-- You might need to fetch this from your database if you don't have a known default.
-- For development, you can use a tenant_id from your 'tenants' table.
DO $$
DECLARE
    default_tenant_id UUID;
BEGIN
    -- Attempt to find an existing tenant_id, e.g., the first one or a specific superadmin tenant
    SELECT id INTO default_tenant_id FROM public.tenants LIMIT 1;

    IF default_tenant_id IS NOT NULL THEN
        UPDATE public.client_consent_records
        SET tenant_id = default_tenant_id
        WHERE tenant_id IS NULL;
    ELSE
        RAISE WARNING 'No default tenant_id found. client_consent_records with NULL tenant_id might remain.';
    END IF;
END $$;

-- Set tenant_id column as NOT NULL
ALTER TABLE public.client_consent_records
ALTER COLUMN tenant_id SET NOT NULL;

-- Add foreign key constraint
ALTER TABLE public.client_consent_records
ADD CONSTRAINT fk_client_consent_records_tenant
FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Update RLS policy for client_consent_records
DROP POLICY IF EXISTS "client_consent_records_rls_policy" ON public.client_consent_records;
CREATE POLICY client_consent_records_rls_policy
ON public.client_consent_records FOR ALL
USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- Optional: Re-enable RLS if it was disabled
ALTER TABLE public.client_consent_records ENABLE ROW LEVEL SECURITY;
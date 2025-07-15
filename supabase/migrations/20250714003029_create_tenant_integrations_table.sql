-- This migration creates the table to store third-party integration credentials for each tenant.

-- We need the pgcrypto extension to handle encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Create a generic function to update the 'updated_at' timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Create the tenant_integrations table
CREATE TABLE public.tenant_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    provider TEXT NOT NULL, -- e.g., 'google', 'microsoft'
    
    access_token TEXT,
    encrypted_refresh_token BYTEA,
    encryption_nonce BYTEA,
    account_email TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT unique_tenant_provider UNIQUE (tenant_id, provider)
);

-- 3. Add the trigger to the new table, calling our generic function
CREATE OR REPLACE TRIGGER trigger_tenant_integrations_updated_at
BEFORE UPDATE ON public.tenant_integrations
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();
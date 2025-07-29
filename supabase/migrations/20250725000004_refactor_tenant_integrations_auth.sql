-- Migration: 20250725000004_refactor_tenant_integrations_auth.sql
-- Description: Refactors the get_tenant_integrations RPC and its RLS policy
-- to use the native Supabase Auth JWT for authorization.

-- Step 1: Drop the old RLS policy from the tenant_integrations table.
DROP POLICY IF EXISTS "Superadmins can manage all tenant integrations" ON public.tenant_integrations;

-- Step 2: Drop the old RPC function that depends on parameters for auth.
DROP FUNCTION IF EXISTS public.get_tenant_integrations(UUID, TEXT, UUID, TEXT);

-- Step 3: Create the new, refactored get_tenant_integrations RPC function.
-- This version removes auth-related parameters and uses the JWT context instead.
CREATE OR REPLACE FUNCTION public.get_tenant_integrations(
    p_tenant_id UUID,
    p_environment TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    tenant_id UUID,
    provider TEXT,
    access_token TEXT,
    account_email TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    encrypted_credentials TEXT,
    nonce TEXT,
    environment TEXT,
    is_active BOOLEAN
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
    v_caller_role TEXT := (auth.jwt() -> 'app_metadata' ->> 'role');
    v_caller_tenant_id UUID := (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid;
BEGIN
    -- Security check: Allow access if the caller is a super_admin
    -- OR if the caller's tenant_id matches the requested tenant_id.
    IF v_caller_role != 'super_admin' AND v_caller_tenant_id != p_tenant_id THEN
        RAISE EXCEPTION 'Access denied. You do not have permission to view integrations for this tenant.';
    END IF;

    -- The main query remains the same, just the authorization logic changes.
    RETURN QUERY
    SELECT
        ti.id,
        ti.tenant_id,
        ti.provider,
        ti.access_token,
        ti.account_email,
        ti.created_at,
        ti.updated_at,
        ti.expires_at,
        ti.encrypted_credentials,
        ti.nonce,
        ti.environment,
        ti.is_active
    FROM
        public.tenant_integrations ti
    WHERE
        ti.tenant_id = p_tenant_id
        AND (p_environment IS NULL OR ti.environment = p_environment);
END;
$$;

-- Step 4: Create the new, refactored RLS policy for the tenant_integrations table.
-- This policy also uses the JWT context, allowing for simpler and more robust security.
CREATE POLICY "Tenant Integration Access Policy"
ON public.tenant_integrations
FOR ALL
USING (
    -- A super_admin can do anything.
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
    OR
    -- Users can manage integrations belonging to their own tenant.
    (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid = tenant_id
)
WITH CHECK (
    -- The same rules apply for creating or modifying records.
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
    OR
    (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid = tenant_id
);

-- COMMENT: Refactors get_tenant_integrations RPC and RLS policies to use native Supabase Auth JWT, removing parameter-based auth and simplifying security rules.

-- MIGRATION: Recreate get_tenant_branches to include the new 'code' column.

-- 1. Drop the existing function.
DROP FUNCTION IF EXISTS public.get_tenant_branches(UUID);

-- 2. Recreate the function with the updated return table definition.
CREATE OR REPLACE FUNCTION public.get_tenant_branches(
    p_tenant_id UUID
)
RETURNS TABLE(
    id UUID,
    tenant_id UUID,
    name TEXT,
    address TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    language_code TEXT,
    currency_id UUID,
    timezone TEXT,
    is_main_branch BOOLEAN,
    status public.branch_status,
    activated_at TIMESTAMPTZ,
    contact_phone TEXT,
    whatsapp_phone TEXT,
    commercial_email TEXT,
    website TEXT,
    physical_address_line1 TEXT,
    physical_address_line2 TEXT,
    physical_city TEXT,
    physical_state TEXT,
    physical_postal_code TEXT,
    latitude NUMERIC(10, 8),
    longitude NUMERIC(11, 8),
    code TEXT -- Added the new column
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT b.*
    FROM public.branches b
    WHERE b.tenant_id = p_tenant_id
    ORDER BY b.is_main_branch DESC, b.name ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_tenant_branches(UUID) TO authenticated;

COMMENT ON FUNCTION public.get_tenant_branches(UUID) IS 'V2: Returns all branches for a given tenant, including the new code column.';

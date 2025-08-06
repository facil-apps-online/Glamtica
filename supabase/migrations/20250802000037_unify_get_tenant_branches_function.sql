-- 1. Eliminar la función que no recibe parámetros.
DROP FUNCTION IF EXISTS public.get_tenant_branches();

-- 2. Eliminar la función que recibe dos parámetros (versión anterior).
DROP FUNCTION IF EXISTS public.get_tenant_branches(TEXT, UUID);

-- 3. Crear la función definitiva con un único parámetro.
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
    language_code VARCHAR(10),
    currency_id UUID,
    timezone TEXT,
    is_main_branch BOOLEAN,
    status branch_status,
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
    latitude REAL,
    longitude REAL
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
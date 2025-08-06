-- 1. Eliminar explícitamente la función existente para permitir el cambio de tipo de retorno.
DROP FUNCTION IF EXISTS public.get_tenant_branches(UUID);

-- 2. Volver a crear la función con la estructura de retorno correcta.
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
    language_code TEXT, -- Corregido
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
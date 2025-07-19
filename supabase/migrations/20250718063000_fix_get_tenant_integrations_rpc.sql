-- Corregir la función get_tenant_integrations para que devuelva la nueva columna expires_at

-- Primero, eliminamos la función existente para poder cambiar su tipo de retorno.
DROP FUNCTION IF EXISTS public.get_tenant_integrations(UUID, TEXT);

-- Luego, la creamos de nuevo con la columna adicional.
CREATE OR REPLACE FUNCTION public.get_tenant_integrations(
    p_tenant_id UUID,
    p_user_role TEXT
)
RETURNS TABLE (
    id UUID,
    tenant_id UUID,
    provider TEXT,
    access_token TEXT,
    encrypted_refresh_token BYTEA,
    encryption_nonce BYTEA,
    account_email TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Comprobar si el rol del usuario que llama es 'super_admin'
    IF p_user_role != 'super_admin' THEN
        RAISE EXCEPTION 'Acceso denegado. Se requiere rol de super_admin para ver integraciones de otros tenants.';
    END IF;

    -- Retornar todas las columnas de las integraciones para el tenant especificado
    RETURN QUERY
    SELECT
        ti.id,
        ti.tenant_id,
        ti.provider,
        ti.access_token,
        ti.encrypted_refresh_token,
        ti.encryption_nonce,
        ti.account_email,
        ti.created_at,
        ti.updated_at,
        ti.expires_at
    FROM
        public.tenant_integrations ti
    WHERE
        ti.tenant_id = p_tenant_id;
END;
$$;
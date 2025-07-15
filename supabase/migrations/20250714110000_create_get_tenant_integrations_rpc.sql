CREATE OR REPLACE FUNCTION public.get_tenant_integrations(
    p_tenant_id UUID,
    p_user_role TEXT
)
RETURNS SETOF public.tenant_integrations
LANGUAGE plpgsql
SECURITY DEFINER -- Esto permite que la función ignore las políticas RLS del usuario que la invoca
AS $$
BEGIN
    -- Paso 1: Comprobar si el rol del usuario que llama es 'super_admin'
    IF p_user_role != 'super_admin' THEN
        RAISE EXCEPTION 'Acceso denegado. Se requiere rol de super_admin para ver integraciones de otros tenants.';
    END IF;

    -- Paso 2: Retornar las integraciones para el tenant especificado
    RETURN QUERY
    SELECT
        id,
        tenant_id,
        provider,
        access_token,
        encrypted_refresh_token,
        encryption_nonce,
        account_email,
        created_at,
        updated_at
    FROM
        public.tenant_integrations
    WHERE
        tenant_id = p_tenant_id;
END;
$$;

-- Otorgar permisos de ejecución a los usuarios autenticados
GRANT EXECUTE ON FUNCTION public.get_tenant_integrations(UUID, TEXT) TO authenticated;

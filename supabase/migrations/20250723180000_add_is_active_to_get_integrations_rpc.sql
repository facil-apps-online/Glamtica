-- Corrige la función get_tenant_integrations para que devuelva la columna is_active.

DROP FUNCTION IF EXISTS public.get_tenant_integrations(UUID, TEXT, UUID, TEXT);

CREATE OR REPLACE FUNCTION public.get_tenant_integrations(
    p_tenant_id UUID,
    p_user_role TEXT,
    p_requesting_user_id UUID,
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
    is_active BOOLEAN -- <-- Columna añadida
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_tenant_id UUID;
BEGIN
    -- La lógica de seguridad no cambia.
    IF p_user_role != 'super_admin' THEN
        SELECT users.tenant_id INTO v_user_tenant_id
        FROM public.users
        WHERE users.id = p_requesting_user_id;

        IF v_user_tenant_id IS NULL OR v_user_tenant_id != p_tenant_id THEN
            RAISE EXCEPTION 'Acceso denegado. No tienes permiso para ver las integraciones de este tenant.';
        END IF;
    END IF;

    -- La consulta ahora incluye la nueva columna.
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
        ti.is_active -- <-- Columna añadida
    FROM
        public.tenant_integrations ti
    WHERE
        ti.tenant_id = p_tenant_id
        AND (p_environment IS NULL OR ti.environment = p_environment);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_tenant_integrations(UUID, TEXT, UUID, TEXT) TO authenticated;

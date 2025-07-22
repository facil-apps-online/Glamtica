-- Migración para permitir que los tenants lean sus propias integraciones.

DROP FUNCTION IF EXISTS public.get_tenant_integrations(UUID, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.get_tenant_integrations(
    p_tenant_id UUID,
    p_user_role TEXT,
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
    environment TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_requesting_tenant_id UUID;
BEGIN
    -- Obtener el tenant_id del usuario que realiza la petición desde el JWT
    v_requesting_tenant_id := (current_setting('request.jwt.claims', TRUE)::jsonb ->> 'tenant_id')::UUID;

    -- Permitir el acceso si:
    -- 1. El usuario es un super_admin.
    -- 2. O, el tenant_id del usuario coincide con el que se está solicitando.
    IF p_user_role = 'super_admin' OR v_requesting_tenant_id = p_tenant_id THEN
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
            ti.environment
        FROM
            public.tenant_integrations ti
        WHERE
            ti.tenant_id = p_tenant_id
            AND (p_environment IS NULL OR ti.environment = p_environment);
    ELSE
        RAISE EXCEPTION 'Acceso denegado. No tienes permiso para ver las integraciones de este tenant.';
    END IF;
END;
$$;

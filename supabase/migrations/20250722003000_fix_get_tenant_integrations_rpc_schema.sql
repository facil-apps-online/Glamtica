-- Corregir la función get_tenant_integrations para alinearla con el nuevo schema de credenciales
-- y añadir un filtro opcional por entorno.

DROP FUNCTION IF EXISTS public.get_tenant_integrations(UUID, TEXT);
DROP FUNCTION IF EXISTS public.get_tenant_integrations(UUID, TEXT, TEXT); -- Eliminar también la posible sobrecarga anterior

CREATE OR REPLACE FUNCTION public.get_tenant_integrations(
    p_tenant_id UUID,
    p_user_role TEXT,
    p_environment TEXT DEFAULT NULL -- Parámetro opcional para el entorno
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
    environment TEXT -- Devolver también el entorno
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $
BEGIN
    IF p_user_role != 'super_admin' THEN
        RAISE EXCEPTION 'Acceso denegado. Se requiere rol de super_admin para ver integraciones de otros tenants.';
    END IF;

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
        AND (p_environment IS NULL OR ti.environment = p_environment); -- Lógica de filtrado
END;
$;

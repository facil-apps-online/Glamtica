-- Migración para crear una función RPC segura para guardar (upsert) integraciones de tenants.
-- Esto centraliza la lógica de permisos en el backend y evita problemas con RLS en operaciones de escritura.

CREATE OR REPLACE FUNCTION public.upsert_tenant_integration(
    p_tenant_id UUID,
    p_provider_slug TEXT,
    p_encrypted_credentials TEXT,
    p_nonce TEXT,
    p_environment TEXT,
    p_user_role TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Paso 1: Verificar explícitamente el permiso del usuario.
    IF p_user_role != 'super_admin' THEN
        RAISE EXCEPTION 'Acceso denegado. Se requiere rol de super_admin para gestionar integraciones.';
    END IF;

    -- Paso 2: Realizar la operación de escritura (INSERT o UPDATE).
    INSERT INTO public.tenant_integrations (
        tenant_id,
        provider,
        encrypted_credentials,
        nonce,
        environment
    )
    VALUES (
        p_tenant_id,
        p_provider_slug,
        p_encrypted_credentials,
        p_nonce,
        p_environment
    )
    ON CONFLICT (tenant_id, provider, environment)
    DO UPDATE SET
        encrypted_credentials = EXCLUDED.encrypted_credentials,
        nonce = EXCLUDED.nonce,
        updated_at = NOW();
END;
$$;

COMMENT ON FUNCTION public.upsert_tenant_integration IS 'Permite a un superadministrador guardar o actualizar las credenciales de una integración para un tenant específico.';

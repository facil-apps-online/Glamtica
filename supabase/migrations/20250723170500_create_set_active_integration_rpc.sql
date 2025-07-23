-- Función para establecer una integración como activa,
-- desactivando cualquier otra para el mismo tenant y proveedor.
CREATE OR REPLACE FUNCTION public.set_active_integration(
    p_integration_id UUID,
    p_requesting_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tenant_id UUID;
    v_provider TEXT;
    v_user_role TEXT;
BEGIN
    -- 1. Verificar que el usuario solicitante es un super_admin
    SELECT role INTO v_user_role
    FROM public.users
    WHERE id = p_requesting_user_id;

    IF v_user_role != 'super_admin' THEN
        RAISE EXCEPTION 'Acceso denegado. Solo los super administradores pueden cambiar integraciones activas.';
    END IF;

    -- 2. Obtener el tenant_id y el provider de la integración que se va a activar.
    SELECT tenant_id, provider INTO v_tenant_id, v_provider
    FROM public.tenant_integrations
    WHERE id = p_integration_id;

    IF v_tenant_id IS NULL THEN
        RAISE EXCEPTION 'Integración no encontrada.';
    END IF;

    -- 3. Desactivar todas las demás integraciones para ese tenant y proveedor.
    UPDATE public.tenant_integrations
    SET is_active = false
    WHERE tenant_id = v_tenant_id
      AND provider = v_provider
      AND id != p_integration_id;

    -- 4. Activar la integración seleccionada.
    UPDATE public.tenant_integrations
    SET is_active = true
    WHERE id = p_integration_id;

END;
$$;

-- Otorgar permisos a los usuarios autenticados para ejecutar la función.
-- La seguridad interna de la función ya valida si el usuario es super_admin.
GRANT EXECUTE ON FUNCTION public.set_active_integration(UUID, UUID) TO authenticated;

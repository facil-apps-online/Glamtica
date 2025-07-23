-- Corrige la función set_active_integration para que utilice la función de ayuda
-- canónica del proyecto: public.is_super_admin() para la verificación de permisos.
-- Esto simplifica la función y la alinea con las convenciones del proyecto.

-- Primero, eliminamos la versión anterior que tenía una firma incorrecta.
DROP FUNCTION IF EXISTS public.set_active_integration(UUID, UUID);

-- Creamos la nueva versión con la firma simplificada y la lógica de autorización correcta.
CREATE OR REPLACE FUNCTION public.set_active_integration(
    p_integration_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tenant_id UUID;
    v_provider TEXT;
BEGIN
    -- 1. Verificar que el usuario solicitante es un super_admin usando la función de ayuda.
    IF NOT public.is_super_admin() THEN
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

-- Otorgar permisos a los usuarios autenticados para ejecutar la nueva función.
GRANT EXECUTE ON FUNCTION public.set_active_integration(UUID) TO authenticated;

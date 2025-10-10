CREATE OR REPLACE FUNCTION public.queue_client_email(
    p_tenant_id UUID,
    p_client_id UUID,
    p_template_type TEXT,
    p_template_data JSONB
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_is_active BOOLEAN;
    v_recipient_email TEXT;
BEGIN
    -- 1. Verificar si el tenant tiene este tipo de notificación activada.
    -- Si no existe una configuración, asumimos que está activa por defecto.
    SELECT is_active INTO v_is_active
    FROM public.tenant_template_settings
    WHERE tenant_id = p_tenant_id AND template_type = p_template_type;

    -- Si v_is_active es NULL (no se encontró), lo tratamos como TRUE.
    -- Si es FALSE, salimos de la función.
    IF COALESCE(v_is_active, TRUE) = FALSE THEN
        -- El tenant ha desactivado este tipo de correo, no hacemos nada.
        RETURN;
    END IF;

    -- 2. Obtener el email del cliente.
    SELECT email INTO v_recipient_email
    FROM public.clients
    WHERE id = p_client_id;

    -- 3. Si se encontró un email válido, insertar en la cola.
    IF v_recipient_email IS NOT NULL THEN
        INSERT INTO public.client_email_queue (
            tenant_id,
            recipient_client_id,
            recipient_email,
            template_type,
            template_data
        )
        VALUES (
            p_tenant_id,
            p_client_id,
            v_recipient_email,
            p_template_type,
            p_template_data
        );
    END IF;

END;
$$;

-- Otorgar permisos para que el backend pueda llamar a esta función
GRANT EXECUTE ON FUNCTION public.queue_client_email(UUID, UUID, TEXT, JSONB) TO authenticated;

COMMENT ON FUNCTION public.queue_client_email IS 'Encola un correo para un cliente verificando si la notificación está activa para el tenant.';

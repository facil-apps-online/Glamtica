CREATE OR REPLACE FUNCTION public.queue_client_whatsapp(
    p_tenant_id UUID,
    p_client_id UUID,
    p_template_name TEXT,
    p_template_params JSONB
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_is_active BOOLEAN;
    v_recipient_phone_number TEXT;
BEGIN
    -- 1. Check if this notification type is active for the tenant.
    -- If no setting exists, we assume it's active by default.
    SELECT is_active INTO v_is_active
    FROM public.tenant_template_settings
    WHERE tenant_id = p_tenant_id AND template_type = p_template_name;

    -- If v_is_active is NULL (not found), treat as TRUE.
    -- If it is FALSE, exit the function.
    IF COALESCE(v_is_active, TRUE) = FALSE THEN
        -- This notification type is disabled by the tenant, do nothing.
        RETURN;
    END IF;

    -- 2. Get the client's phone number.
    SELECT phone INTO v_recipient_phone_number
    FROM public.clients
    WHERE id = p_client_id;

    -- 3. If a valid phone number is found, insert into the queue.
    IF v_recipient_phone_number IS NOT NULL THEN
        INSERT INTO public.client_whatsapp_queue (
            tenant_id,
            recipient_client_id,
            recipient_phone_number,
            template_name,
            template_params
        )
        VALUES (
            p_tenant_id,
            p_client_id,
            v_recipient_phone_number,
            p_template_name,
            p_template_params
        );
    END IF;

END;
$$;

-- Grant permissions for the backend to call this function
GRANT EXECUTE ON FUNCTION public.queue_client_whatsapp(UUID, UUID, TEXT, JSONB) TO authenticated;

COMMENT ON FUNCTION public.queue_client_whatsapp IS 'Queues a WhatsApp message for a client after verifying that the notification type is active for the tenant.';

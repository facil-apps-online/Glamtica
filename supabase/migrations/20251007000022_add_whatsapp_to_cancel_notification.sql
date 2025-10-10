-- MIGRATION: Add WhatsApp notification to cancellation flow and fix email params.

CREATE OR REPLACE FUNCTION public.cancel_attention_and_notify(
    p_attention_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_attention RECORD;
BEGIN
    -- Step 1: Get attention details for the notification
    SELECT tenant_id, client_id INTO v_attention FROM public.attentions WHERE id = p_attention_id;

    IF v_attention IS NULL THEN
        RAISE EXCEPTION 'Attention with ID % not found.', p_attention_id;
    END IF;

    -- Step 2: Update the attention status
    UPDATE public.attentions
    SET status = 'Cancelada'
    WHERE id = p_attention_id;

    -- Step 3: Enqueue client notifications for the cancellation
    BEGIN
        -- Email Notification
        PERFORM public.queue_client_email(
            p_tenant_id := v_attention.tenant_id,
            p_client_id := v_attention.client_id,
            p_template_type := 'attention_cancelled',
            p_template_data := '{}'::jsonb
        );
    EXCEPTION
        WHEN others THEN
            RAISE WARNING 'Failed to queue client cancellation email for attention_id %: %', p_attention_id, SQLERRM;
    END;

    BEGIN
        -- WhatsApp Notification
        PERFORM public.queue_client_whatsapp(
            p_tenant_id := v_attention.tenant_id,
            p_client_id := v_attention.client_id,
            p_template_name := 'attention_cancelled_whatsapp',
            p_template_params := '{}'::jsonb
        );
    EXCEPTION
        WHEN others THEN
            RAISE WARNING 'Failed to queue client cancellation WhatsApp for attention_id %: %', p_attention_id, SQLERRM;
    END;

END;
$$;

COMMENT ON FUNCTION public.cancel_attention_and_notify IS 'V2: Cancels an attention and queues both email and WhatsApp notifications for the client.';

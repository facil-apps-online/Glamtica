-- MIGRATION: Create function to cancel an attention and queue notification

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

    -- Step 3: Enqueue the client notification email
    BEGIN
        PERFORM public.queue_client_email(
            p_attention_id := p_attention_id,
            p_tenant_id := v_attention.tenant_id,
            p_template_name := 'attention_cancelled'
        );
    EXCEPTION
        WHEN others THEN
            -- Log the error but do not fail the transaction
            RAISE WARNING 'Failed to queue client cancellation email for attention_id %: %', p_attention_id, SQLERRM;
    END;

END;
$$;

COMMENT ON FUNCTION public.cancel_attention_and_notify IS 'Cancels an attention and queues a notification email for the client.';

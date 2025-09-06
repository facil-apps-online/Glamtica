CREATE OR REPLACE FUNCTION reschedule_attention(
    p_attention_id UUID,
    p_new_datetime TIMESTAMPTZ,
    p_reason TEXT
)
RETURNS VOID AS $$
DECLARE
    v_original_date TIMESTAMPTZ;
    v_client_id UUID;
    v_user_id UUID := auth.uid();
BEGIN
    -- Get original date and client_id from the attention
    SELECT attention_datetime, client_id
    INTO v_original_date, v_client_id
    FROM attentions
    WHERE id = p_attention_id;

    -- Update the attention with the new date and time
    UPDATE attentions
    SET attention_datetime = p_new_datetime
    WHERE id = p_attention_id;

    -- Insert a record into the rescheduled_attentions table
    INSERT INTO rescheduled_attentions (attention_id, client_id, original_date, new_date, reason, user_id)
    VALUES (p_attention_id, v_client_id, v_original_date, p_new_datetime, p_reason, v_user_id);

END;
$$ LANGUAGE plpgsql;
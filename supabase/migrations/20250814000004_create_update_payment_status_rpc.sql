CREATE OR REPLACE FUNCTION update_purchase_payment_status(
    p_purchase_id UUID,
    p_payment_status TEXT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE public.purchases
    SET payment_status = p_payment_status,
        updated_at = now()
    WHERE id = p_purchase_id;
END;
$$;

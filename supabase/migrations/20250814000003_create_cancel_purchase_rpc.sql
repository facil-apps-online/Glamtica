CREATE OR REPLACE FUNCTION cancel_purchase(p_purchase_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE public.purchases
    SET status = 'cancelada',
        updated_at = now()
    WHERE id = p_purchase_id;
END;
$$;

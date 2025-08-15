CREATE OR REPLACE FUNCTION public.reject_product_transfer(
    p_transfer_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tenant_id uuid;
    updated_transfer record;
BEGIN
    v_tenant_id := (auth.jwt()->>'app_metadata')::jsonb->>'tenant_id';

    -- Update the transfer status to 'rechazado'
    UPDATE public.product_transfers
    SET status = 'rechazado', updated_at = now()
    WHERE id = p_transfer_id AND tenant_id = v_tenant_id AND status = 'solicitado'
    RETURNING * INTO updated_transfer;

    IF updated_transfer IS NULL THEN
        RAISE EXCEPTION 'Transfer not found, not in "solicitado" state, or you do not have permission to reject it.';
    END IF;

    RETURN to_jsonb(updated_transfer);
END;
$$;

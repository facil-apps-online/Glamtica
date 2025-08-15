CREATE OR REPLACE FUNCTION public.ship_product_transfer(
    p_transfer_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tenant_id uuid;
    v_transfer record;
    item record;
BEGIN
    v_tenant_id := (auth.jwt()->>'tenant_id')::uuid;

    -- 1. Find the approved transfer for the current tenant
    SELECT * INTO v_transfer
    FROM public.product_transfers
    WHERE id = p_transfer_id AND tenant_id = v_tenant_id AND status = 'aprobado';

    IF v_transfer IS NULL THEN
        RAISE EXCEPTION 'Approved transfer not found or you do not have permission to ship it.';
    END IF;

    -- 2. Deduct stock from the origin branch for each item in the transfer
    FOR item IN
        SELECT pti.product_id, pti.quantity
        FROM public.product_transfer_items pti
        WHERE pti.transfer_id = v_transfer.id
    LOOP
        UPDATE public.branch_products
        SET stock_quantity = stock_quantity - item.quantity
        WHERE branch_id = v_transfer.origin_branch_id AND product_id = item.product_id;
    END LOOP;

    -- 3. Update the transfer status to 'en_transito'
    UPDATE public.product_transfers
    SET status = 'en_transito', updated_at = now()
    WHERE id = p_transfer_id
    RETURNING * INTO v_transfer;

    -- 4. Return the updated transfer
    RETURN to_jsonb(v_transfer);
END;
$$;
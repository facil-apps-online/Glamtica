CREATE OR REPLACE FUNCTION public.approve_product_transfer(
    p_transfer_id uuid,
    p_adjusted_items jsonb -- [{ "item_id": "uuid", "quantity": integer }, ...]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tenant_id uuid;
    v_origin_branch_id uuid;
    item jsonb;
    v_product_id uuid;
    v_stock numeric;
    updated_transfer record;
BEGIN
    v_tenant_id := (auth.jwt()->>'app_metadata')::jsonb->>'tenant_id';

    -- 1. Check if the transfer exists and get its origin branch
    SELECT origin_branch_id INTO v_origin_branch_id
    FROM public.product_transfers
    WHERE id = p_transfer_id AND tenant_id = v_tenant_id AND status = 'solicitado';

    IF v_origin_branch_id IS NULL THEN
        RAISE EXCEPTION 'Transfer not found, not in "solicitado" state, or you do not have permission to approve it.';
    END IF;

    -- 2. Update quantities for each item and check stock
    FOR item IN SELECT * FROM jsonb_array_elements(p_adjusted_items)
    LOOP
        -- Get product_id for the item
        SELECT product_id INTO v_product_id
        FROM public.product_transfer_items
        WHERE id = (item->>'item_id')::uuid;

        -- Check available stock in the origin branch
        SELECT stock_quantity INTO v_stock
        FROM public.branch_products
        WHERE branch_id = v_origin_branch_id AND product_id = v_product_id;

        IF v_stock IS NULL OR v_stock < (item->>'quantity')::numeric THEN
            RAISE EXCEPTION 'Not enough stock for product ID % in origin branch.', v_product_id;
        END IF;

        -- Update the quantity in the transfer item
        UPDATE public.product_transfer_items
        SET quantity = (item->>'quantity')::integer, updated_at = now()
        WHERE id = (item->>'item_id')::uuid;
    END LOOP;

    -- 3. Update the transfer status to 'aprobado'
    UPDATE public.product_transfers
    SET status = 'aprobado', updated_at = now()
    WHERE id = p_transfer_id
    RETURNING * INTO updated_transfer;

    -- 4. Return the updated transfer
    RETURN to_jsonb(updated_transfer);
END;
$$;

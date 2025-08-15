DROP FUNCTION IF EXISTS public.ship_product_transfer(uuid);

CREATE OR REPLACE FUNCTION public.ship_product_transfer(
    p_transfer_id uuid,
    p_tenant_id uuid,
    p_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_transfer record;
    item record;
    v_user_is_in_origin_branch boolean;
BEGIN
    -- 1. Find the approved transfer for the current tenant
    SELECT * INTO v_transfer
    FROM public.product_transfers
    WHERE id = p_transfer_id AND tenant_id = p_tenant_id AND status = 'aprobado';

    IF v_transfer IS NULL THEN
        RAISE EXCEPTION 'Approved transfer not found.';
    END IF;

    -- 2. Check if the user is assigned to the origin branch
    SELECT EXISTS (
        SELECT 1
        FROM auth.users u,
             jsonb_array_elements(u.raw_app_meta_data->'assignments') as assignment
        WHERE u.id = p_user_id
          AND assignment->>'branch_id' = v_transfer.origin_branch_id::text
          AND assignment->>'tenant_id' = p_tenant_id::text
    ) INTO v_user_is_in_origin_branch;

    IF NOT v_user_is_in_origin_branch THEN
        RAISE EXCEPTION 'You do not have permission to ship this transfer.';
    END IF;

    -- 3. Deduct stock from the origin branch for each item in the transfer
    FOR item IN
        SELECT pti.product_id, pti.quantity
        FROM public.product_transfer_items pti
        WHERE pti.transfer_id = v_transfer.id
    LOOP
        UPDATE public.branch_products
        SET stock_quantity = stock_quantity - item.quantity
        WHERE branch_id = v_transfer.origin_branch_id AND product_id = item.product_id;
    END LOOP;

    -- 4. Update the transfer status to 'en_transito'
    UPDATE public.product_transfers
    SET status = 'en_transito', updated_at = now()
    WHERE id = p_transfer_id
    RETURNING * INTO v_transfer;

    -- 5. Return the updated transfer
    RETURN to_jsonb(v_transfer);
END;
$$;

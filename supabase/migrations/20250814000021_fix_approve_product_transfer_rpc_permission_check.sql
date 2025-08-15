DROP FUNCTION IF EXISTS public.approve_product_transfer(uuid, jsonb, uuid, uuid);

CREATE OR REPLACE FUNCTION public.approve_product_transfer(
    p_transfer_id uuid,
    p_adjusted_items jsonb,
    p_tenant_id uuid,
    p_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_origin_branch_id uuid;
    item jsonb;
    v_product_id uuid;
    v_stock numeric;
    updated_transfer record;
    v_user_is_in_origin_branch boolean;
BEGIN
    -- 1. Check if the transfer exists and get its origin branch
    SELECT origin_branch_id INTO v_origin_branch_id
    FROM public.product_transfers
    WHERE id = p_transfer_id AND tenant_id = p_tenant_id AND status = 'solicitado';

    IF v_origin_branch_id IS NULL THEN
        RAISE EXCEPTION 'Transfer not found or not in "solicitado" state.';
    END IF;

    -- 2. Check if the user is assigned to the origin branch
    SELECT EXISTS (
        SELECT 1
        FROM auth.users u,
             jsonb_array_elements(u.raw_app_meta_data->'assignments') as assignment
        WHERE u.id = p_user_id
          AND assignment->>'branch_id' = v_origin_branch_id::text
          AND assignment->>'tenant_id' = p_tenant_id::text
    ) INTO v_user_is_in_origin_branch;

    IF NOT v_user_is_in_origin_branch THEN
        RAISE EXCEPTION 'You do not have permission to approve this transfer.';
    END IF;

    -- 3. Update quantities for each item and check stock
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

    -- 4. Update the transfer status to 'aprobado'
    UPDATE public.product_transfers
    SET status = 'aprobado', updated_at = now()
    WHERE id = p_transfer_id
    RETURNING * INTO updated_transfer;

    -- 5. Return the updated transfer
    RETURN to_jsonb(updated_transfer);
END;
$$;

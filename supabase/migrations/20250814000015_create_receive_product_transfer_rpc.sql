CREATE OR REPLACE FUNCTION public.receive_product_transfer(
    p_transfer_id uuid,
    p_reception_notes text,
    p_received_items jsonb -- [{ "transfer_item_id": "uuid", "quantity_received": integer }, ...]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tenant_id uuid;
    v_transfer record;
    v_reception_id uuid;
    v_item jsonb;
    v_transfer_item record;
    v_branch_product record;
    v_origin_branch_product record;
    v_costing_method text;
    v_new_cost_price numeric;
    v_has_discrepancies boolean := false;
BEGIN
    -- 1. Get Tenant ID and costing method
    v_tenant_id := (auth.jwt()->>'app_metadata')::jsonb->>'tenant_id';
    SELECT settings_data->>'costing_method' INTO v_costing_method
    FROM public.tenant_settings
    WHERE tenant_id = v_tenant_id;
    v_costing_method := COALESCE(v_costing_method, 'average');

    -- 2. Get the transfer details
    SELECT * INTO v_transfer
    FROM public.product_transfers
    WHERE id = p_transfer_id AND tenant_id = v_tenant_id AND status = 'en_transito';

    IF v_transfer IS NULL THEN
        RAISE EXCEPTION 'Transfer not found, not in "en_transito" state, or you do not have permission.';
    END IF;

    -- 3. Create the reception record
    INSERT INTO public.product_transfer_receptions (transfer_id, tenant_id, notes, reception_date)
    VALUES (p_transfer_id, v_tenant_id, p_reception_notes, now())
    RETURNING id INTO v_reception_id;

    -- 4. Process each received item
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_received_items)
    LOOP
        SELECT * INTO v_transfer_item FROM public.product_transfer_items WHERE id = (v_item->>'transfer_item_id')::uuid;

        INSERT INTO public.product_transfer_reception_items (reception_id, transfer_item_id, product_id, quantity_expected, quantity_received)
        VALUES (v_reception_id, v_transfer_item.id, v_transfer_item.product_id, v_transfer_item.quantity, (v_item->>'quantity_received')::integer);

        IF v_transfer_item.quantity <> (v_item->>'quantity_received')::integer THEN
            v_has_discrepancies := true;
        END IF;

        SELECT * INTO v_branch_product FROM public.branch_products WHERE branch_id = v_transfer.destination_branch_id AND product_id = v_transfer_item.product_id;
        SELECT cost_price INTO v_origin_branch_product FROM public.branch_products WHERE branch_id = v_transfer.origin_branch_id AND product_id = v_transfer_item.product_id;

        -- 5. Update stock and cost price in destination branch
        IF v_branch_product IS NULL THEN
            INSERT INTO public.branch_products (branch_id, product_id, tenant_id, stock_quantity, cost_price, is_active)
            VALUES (v_transfer.destination_branch_id, v_transfer_item.product_id, v_tenant_id, (v_item->>'quantity_received')::integer, v_origin_branch_product.cost_price, true);
        ELSE
            IF v_costing_method = 'average' AND (v_branch_product.stock_quantity + (v_item->>'quantity_received')::integer) > 0 THEN
                v_new_cost_price := ((v_branch_product.stock_quantity * v_branch_product.cost_price) + ((v_item->>'quantity_received')::integer * v_origin_branch_product.cost_price)) / (v_branch_product.stock_quantity + (v_item->>'quantity_received')::integer);
            ELSE
                v_new_cost_price := v_origin_branch_product.cost_price;
            END IF;

            UPDATE public.branch_products
            SET
                stock_quantity = v_branch_product.stock_quantity + (v_item->>'quantity_received')::integer,
                cost_price = v_new_cost_price,
                updated_at = now()
            WHERE id = v_branch_product.id;
        END IF;
    END LOOP;

    -- 6. Update transfer status
    UPDATE public.product_transfers
    SET status = CASE WHEN v_has_discrepancies THEN 'recibido_con_incidencias' ELSE 'completado' END, updated_at = now()
    WHERE id = p_transfer_id;

    -- 7. Return reception ID
    RETURN jsonb_build_object('reception_id', v_reception_id);
END;
$$;

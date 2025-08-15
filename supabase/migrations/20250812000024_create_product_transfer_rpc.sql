CREATE TYPE product_transfer_item_type AS (product_id UUID, quantity INTEGER);

CREATE OR REPLACE FUNCTION create_product_transfer(
    p_tenant_id UUID,
    p_from_branch_id UUID,
    p_to_branch_id UUID,
    p_transfer_date TIMESTAMPTZ,
    p_notes TEXT,
    p_items product_transfer_item_type[]
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    v_transfer_id UUID;
    item product_transfer_item_type;
BEGIN
    -- Create the product transfer record
    INSERT INTO product_transfers (tenant_id, from_branch_id, to_branch_id, transfer_date, status, notes)
    VALUES (p_tenant_id, p_from_branch_id, p_to_branch_id, p_transfer_date, 'en_proceso', p_notes)
    RETURNING id INTO v_transfer_id;

    -- Insert items and decrement stock
    FOREACH item IN ARRAY p_items
    LOOP
        INSERT INTO product_transfer_items (transfer_id, product_id, quantity)
        VALUES (v_transfer_id, item.product_id, item.quantity);

        UPDATE branch_products
        SET stock = stock - item.quantity
        WHERE branch_id = p_from_branch_id AND product_id = item.product_id;
    END LOOP;

    RETURN v_transfer_id;
END;
$$;

CREATE OR REPLACE FUNCTION update_product_transfer_status(
    p_tenant_id UUID,
    p_transfer_id UUID,
    p_status TEXT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    v_transfer product_transfers;
    v_tenant_settings JSONB;
    v_costing_method TEXT;
    item record;
    v_from_branch_product branch_products;
    v_to_branch_product branch_products;
    v_new_cost_price NUMERIC;
BEGIN
    -- Get the transfer details
    SELECT * INTO v_transfer FROM product_transfers WHERE id = p_transfer_id;

    -- Get tenant settings
    SELECT settings_data INTO v_tenant_settings FROM tenant_settings WHERE tenant_id = p_tenant_id;
    v_costing_method := v_tenant_settings->>'costing_method';

    -- Update the status
    UPDATE product_transfers SET status = p_status, updated_at = now() WHERE id = p_transfer_id;

    -- If completed, increment stock and update cost price in the destination branch
    IF p_status = 'completado' THEN
        FOR item IN SELECT * FROM product_transfer_items WHERE transfer_id = p_transfer_id
        LOOP
            -- Get product details from both branches
            SELECT * INTO v_from_branch_product FROM branch_products WHERE branch_id = v_transfer.from_branch_id AND product_id = item.product_id;
            SELECT * INTO v_to_branch_product FROM branch_products WHERE branch_id = v_transfer.to_branch_id AND product_id = item.product_id;

            -- Calculate new cost price based on costing method
            IF v_costing_method = 'ponderado' THEN
                v_new_cost_price := ((v_to_branch_product.stock * v_to_branch_product.cost_price) + (item.quantity * v_from_branch_product.cost_price)) / (v_to_branch_product.stock + item.quantity);
            ELSE -- Default to last_cost
                v_new_cost_price := v_from_branch_product.cost_price;
            END IF;

            -- Update stock and cost price in destination branch
            UPDATE branch_products
            SET stock = stock + item.quantity,
                cost_price = v_new_cost_price
            WHERE id = v_to_branch_product.id;
        END LOOP;
    END IF;

    -- If cancelled, increment stock back in the origin branch
    IF p_status = 'cancelado' THEN
        FOR item IN SELECT * FROM product_transfer_items WHERE transfer_id = p_transfer_id
        LOOP
            UPDATE branch_products
            SET stock = stock + item.quantity
            WHERE branch_id = v_transfer.from_branch_id AND product_id = item.product_id;
        END LOOP;
    END IF;

END;
$$;
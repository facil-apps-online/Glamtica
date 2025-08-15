CREATE TYPE received_item_type AS (
    purchase_item_id UUID,
    product_id UUID,
    quantity_expected INT,
    quantity_received INT
);

CREATE OR REPLACE FUNCTION receive_purchase(
    p_tenant_id UUID,
    p_purchase_id UUID,
    p_branch_id UUID,
    p_received_items JSONB,
    p_reception_notes TEXT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    item RECORD;
    total_expected INT := 0;
    total_received INT := 0;
    new_status TEXT;
BEGIN
    -- Loop through received items to update stock and record reception
    FOR item IN SELECT * FROM jsonb_to_recordset(p_received_items) AS x(purchase_item_id UUID, product_id UUID, quantity_expected INT, quantity_received INT)
    LOOP
        -- Update stock quantity for the product in the branch
        UPDATE public.branch_products
        SET stock_quantity = stock_quantity + item.quantity_received
        WHERE branch_id = p_branch_id AND product_id = item.product_id;

        -- Insert a record into the reception details table
        INSERT INTO public.purchase_item_receptions (purchase_item_id, tenant_id, quantity_expected, quantity_received)
        VALUES (item.purchase_item_id, p_tenant_id, item.quantity_expected, item.quantity_received);

        total_expected := total_expected + item.quantity_expected;
        total_received := total_received + item.quantity_received;
    END LOOP;

    -- Determine the new status for the purchase
    IF total_received < total_expected THEN
        new_status := 'completada_con_incidencias';
    ELSE
        new_status := 'completada';
    END IF;

    -- Update the purchase status and notes
    UPDATE public.purchases
    SET status = new_status,
        reception_notes = p_reception_notes,
        updated_at = now()
    WHERE id = p_purchase_id;

END;
$$;

CREATE OR REPLACE FUNCTION public.create_product_movement(
    p_tenant_id uuid,
    p_branch_id uuid,
    p_product_id uuid,
    p_movement_type text,
    p_quantity_change numeric,
    p_cost_of_change numeric, -- The unit cost of the items in *this* movement
    p_reference_id uuid DEFAULT NULL,
    p_reference_type text DEFAULT NULL
)
RETURNS void AS $$
DECLARE
    branch_product_rec RECORD;
    new_stock numeric;
    new_avg_cost numeric;
BEGIN
    -- Lock the specific branch_product row to prevent race conditions on stock updates
    SELECT *
    INTO branch_product_rec
    FROM public.branch_products
    WHERE branch_id = p_branch_id AND product_id = p_product_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Product % not found in branch %', p_product_id, p_branch_id;
    END IF;

    -- Calculate new stock
    new_stock := branch_product_rec.stock_quantity + p_quantity_change;

    -- Calculate new weighted average cost
    -- Avoid division by zero if the new stock is zero
    IF new_stock > 0 THEN
        -- (Current total value + Value of change) / New total quantity
        new_avg_cost := ((branch_product_rec.stock_quantity * branch_product_rec.cost_price) + (p_quantity_change * p_cost_of_change)) / new_stock;
    ELSE
        -- If stock is zero, the cost should also be zero.
        new_avg_cost := 0;
    END IF;

    -- Update the branch_products table with the new stock and cost
    UPDATE public.branch_products
    SET
        stock_quantity = new_stock,
        cost_price = new_avg_cost
    WHERE id = branch_product_rec.id;

    -- Insert the movement record with the snapshot values
    INSERT INTO public.product_movements (
        tenant_id,
        branch_id,
        product_id,
        movement_date,
        movement_type,
        quantity_change,
        cost_of_change,
        stock_after_movement,
        cost_after_movement,
        reference_id,
        reference_type
    ) VALUES (
        p_tenant_id,
        p_branch_id,
        p_product_id,
        now(),
        p_movement_type,
        p_quantity_change,
        p_cost_of_change,
        new_stock,
        new_avg_cost,
        p_reference_id,
        p_reference_type
    );

END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.create_product_movement IS 'Records a product movement, updates the stock and weighted average cost for the product in the branch.';

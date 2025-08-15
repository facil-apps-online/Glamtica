CREATE OR REPLACE FUNCTION adjust_purchase_total(p_purchase_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_branch_id UUID;
    new_total_amount NUMERIC;
BEGIN
    -- Get the branch_id from the purchase
    SELECT branch_id INTO v_branch_id
    FROM public.purchases
    WHERE id = p_purchase_id;

    -- Calculate the new total based on received quantities and current branch cost
    SELECT COALESCE(SUM(pri.quantity_received * bp.cost_price), 0)
    INTO new_total_amount
    FROM public.purchase_item_receptions pri
    JOIN public.purchase_items pi ON pri.purchase_item_id = pi.id
    JOIN public.branch_products bp ON pi.product_id = bp.product_id AND bp.branch_id = v_branch_id
    WHERE pi.purchase_id = p_purchase_id;

    -- Update the total_amount on the purchase
    UPDATE public.purchases
    SET total_amount = new_total_amount
    WHERE id = p_purchase_id;

END;
$$;
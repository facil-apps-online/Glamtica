DROP FUNCTION IF EXISTS public.get_purchase_reception_details(uuid);

CREATE OR REPLACE FUNCTION get_purchase_reception_details(p_purchase_id UUID)
RETURNS TABLE (
    purchase_item_id UUID,
    product_id UUID,
    product_name TEXT,
    quantity_expected INTEGER,
    quantity_received INTEGER,
    cost_price NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_branch_id UUID;
BEGIN
    -- Get the branch_id from the purchase
    SELECT branch_id INTO v_branch_id FROM public.purchases WHERE id = p_purchase_id;

    RETURN QUERY
    SELECT
        pri.purchase_item_id,
        pi.product_id,
        p.name AS product_name,
        pri.quantity_expected,
        pri.quantity_received,
        bp.cost_price -- Get cost_price from branch_products
    FROM
        public.purchase_item_receptions pri
    JOIN
        public.purchase_items pi ON pri.purchase_item_id = pi.id
    JOIN
        public.products p ON pi.product_id = p.id
    LEFT JOIN
        public.branch_products bp ON pi.product_id = bp.product_id AND bp.branch_id = v_branch_id
    WHERE
        pi.purchase_id = p_purchase_id;
END;
$$;
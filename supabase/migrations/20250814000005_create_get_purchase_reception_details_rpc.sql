CREATE OR REPLACE FUNCTION get_purchase_reception_details(p_purchase_id UUID)
RETURNS TABLE (
    purchase_item_id UUID,
    product_id UUID,
    product_name TEXT,
    quantity_expected INTEGER,
    quantity_received INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        pri.purchase_item_id,
        pi.product_id,
        p.name AS product_name,
        pri.quantity_expected,
        pri.quantity_received
    FROM
        public.purchase_item_receptions pri
    JOIN
        public.purchase_items pi ON pri.purchase_item_id = pi.id
    JOIN
        public.products p ON pi.product_id = p.id
    WHERE
        pi.purchase_id = p_purchase_id;
END;
$$;

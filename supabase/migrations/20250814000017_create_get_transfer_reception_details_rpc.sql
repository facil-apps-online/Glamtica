CREATE OR REPLACE FUNCTION public.get_transfer_reception_details(
    p_transfer_id uuid
)
RETURNS TABLE (
    transfer_item_id uuid,
    product_id uuid,
    product_name text,
    quantity_expected integer,
    quantity_received integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tenant_id uuid;
BEGIN
    v_tenant_id := (auth.jwt()->>'app_metadata')::jsonb->>'tenant_id';

    RETURN QUERY
    SELECT
        ptri.transfer_item_id,
        ptri.product_id,
        p.name as product_name,
        ptri.quantity_expected,
        ptri.quantity_received
    FROM
        public.product_transfer_reception_items ptri
    JOIN
        public.product_transfer_receptions ptr ON ptri.reception_id = ptr.id
    JOIN
        public.products p ON ptri.product_id = p.id
    WHERE
        ptr.transfer_id = p_transfer_id
        AND ptr.tenant_id = v_tenant_id;
END;
$$;

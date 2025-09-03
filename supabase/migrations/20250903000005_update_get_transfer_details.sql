DROP FUNCTION IF EXISTS public.get_transfer_details(uuid, uuid);

CREATE OR REPLACE FUNCTION public.get_transfer_details(
    p_transfer_id uuid,
    p_tenant_id uuid
)
RETURNS TABLE (
    item_id uuid,
    product_id uuid,
    product_name text,
    quantity numeric, -- Cambiado de integer a numeric
    allow_decimal_sale boolean -- Nueva columna
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        pti.id as item_id,
        pti.product_id,
        p.name as product_name,
        pti.quantity,
        p.allow_decimal_sale -- Añadido el nuevo campo
    FROM
        public.product_transfer_items pti
    JOIN
        public.products p ON pti.product_id = p.id
    JOIN
        public.product_transfers pt ON pti.transfer_id = pt.id
    WHERE
        pti.transfer_id = p_transfer_id
        AND pt.tenant_id = p_tenant_id;
END;
$$;

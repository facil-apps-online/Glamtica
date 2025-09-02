-- MIGRACIÓN PARA CREAR LA FUNCIÓN get_detailed_combos_for_branch
-- Esta función optimizada devuelve todos los detalles de los combos asignados a una sucursal,
-- incluyendo sus items y precios específicos de la sucursal, en una sola consulta.

CREATE OR REPLACE FUNCTION public.get_detailed_combos_for_branch(
    p_tenant_id UUID,
    p_branch_id UUID
)
RETURNS TABLE(
    id UUID,
    name TEXT,
    description TEXT,
    sku TEXT,
    is_active_in_branch BOOLEAN,
    items JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id,
        c.name,
        c.description,
        c.sku,
        bc.is_active AS is_active_in_branch,
        COALESCE(
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'item_id', ci.id,
                        'product_id', ci.product_id,
                        'service_id', ci.service_id,
                        'name', COALESCE(p.name, s.name),
                        'quantity', ci.quantity,
                        'base_price', ci.price,
                        'override_price', bcip.price,
                        'final_price', COALESCE(bcip.price, ci.price),
                        'duration_minutes', s.duration_minutes -- Solo para servicios
                    )
                )
                FROM public.combo_items ci
                LEFT JOIN public.products p ON p.id = ci.product_id
                LEFT JOIN public.services s ON s.id = ci.service_id
                LEFT JOIN public.branch_combo_item_prices bcip ON bcip.combo_id = ci.combo_id
                    AND bcip.branch_id = p_branch_id
                    AND (bcip.product_id = ci.product_id OR bcip.service_id = ci.service_id)
                WHERE ci.combo_id = c.id
            ),
            '[]'::jsonb
        ) AS items
    FROM public.combos c
    JOIN public.branch_combos bc ON bc.combo_id = c.id
    WHERE
        c.tenant_id = p_tenant_id AND bc.branch_id = p_branch_id
    ORDER BY c.name ASC;
END;
$$;
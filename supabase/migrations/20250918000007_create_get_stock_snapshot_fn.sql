CREATE OR REPLACE FUNCTION public.get_stock_snapshot(
    p_tenant_id uuid,
    p_branch_id uuid,
    p_report_date date
)
RETURNS TABLE(
    product_id uuid,
    product_name text,
    product_sku text,
    stock_at_date numeric,
    cost_at_date numeric,
    last_movement_date timestamptz
) AS $$
BEGIN
    RETURN QUERY
    WITH ranked_movements AS (
        SELECT
            pm.product_id,
            pm.stock_after_movement,
            pm.cost_after_movement,
            pm.movement_date,
            ROW_NUMBER() OVER(PARTITION BY pm.product_id ORDER BY pm.movement_date DESC, pm.id DESC) as rn
        FROM public.product_movements pm
        WHERE pm.tenant_id = p_tenant_id
          AND pm.branch_id = p_branch_id
          AND pm.movement_date <= p_report_date::timestamptz + interval '1 day' - interval '1 second' -- End of the selected day
    )
    SELECT
        p.id,
        p.name,
        p.sku,
        rm.stock_after_movement,
        rm.cost_after_movement,
        rm.movement_date
    FROM ranked_movements rm
    JOIN public.products p ON rm.product_id = p.id
    WHERE rm.rn = 1;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.get_stock_snapshot IS 'Returns the last known stock and cost for each product in a branch on or before a specific date.';

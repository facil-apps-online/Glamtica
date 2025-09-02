CREATE OR REPLACE FUNCTION get_stock_report(
    p_tenant_id UUID,
    p_date_from TEXT,
    p_date_to TEXT
)
RETURNS TABLE (
    branch_name TEXT,
    product_name TEXT,
    quantity NUMERIC,
    cost NUMERIC,
    stock_value NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        b.name AS branch_name,
        p.name AS product_name,
        bp.stock_quantity AS quantity,
        bp.cost_price AS cost,
        (bp.stock_quantity * bp.cost_price) AS stock_value
    FROM
        branch_products bp
    JOIN
        branches b ON bp.branch_id = b.id
    JOIN
        products p ON bp.product_id = p.id
    WHERE
        b.tenant_id = p_tenant_id
        AND bp.updated_at >= TO_TIMESTAMP(p_date_from, 'YYYY-MM-DD')
        AND bp.updated_at <= TO_TIMESTAMP(p_date_to, 'YYYY-MM-DD')
    ORDER BY
        b.name, p.name;
END;
$$ LANGUAGE plpgsql;

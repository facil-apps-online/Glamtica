-- Migration: Update get_product_sellers function to support searching

CREATE OR REPLACE FUNCTION public.get_product_sellers(
  p_product_id UUID,
  p_branch_id UUID,
  p_tenant_id UUID,
  p_search_term TEXT DEFAULT NULL
)
RETURNS TABLE (
  user_id UUID,
  first_name TEXT,
  last_name TEXT,
  commission_rate NUMERIC
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        u.id,
        (u.raw_user_meta_data ->> 'first_name'),
        (u.raw_user_meta_data ->> 'last_name'),
        COALESCE(
            (SELECT puc.commission_rate
             FROM public.product_user_commissions puc
             WHERE puc.user_id = ua.user_id
               AND puc.branch_id = ua.branch_id
               AND puc.product_id = p_product_id
             ORDER BY puc.created_at DESC
             LIMIT 1),
            ua.default_product_commission_rate,
            0.00
        ) AS commission_rate
    FROM
        public.user_assignments ua
    JOIN
        auth.users u ON ua.user_id = u.id
    WHERE
        ua.tenant_id = p_tenant_id
        AND ua.branch_id = p_branch_id
        AND ua.status = 'active'
        AND (
            p_search_term IS NULL OR
            (u.raw_user_meta_data ->> 'first_name') ILIKE '%' || p_search_term || '%' OR
            (u.raw_user_meta_data ->> 'last_name') ILIKE '%' || p_search_term || '%'
        );
END;
$$;

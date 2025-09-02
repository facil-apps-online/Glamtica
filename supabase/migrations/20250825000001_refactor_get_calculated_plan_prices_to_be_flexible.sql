-- MIGRATION: Refactor get_calculated_plan_prices to avoid hard failure on missing exchange rates.

DROP FUNCTION IF EXISTS public.get_calculated_plan_prices();

CREATE OR REPLACE FUNCTION public.get_calculated_plan_prices()
RETURNS TABLE (
    plan_id UUID,
    plan_name TEXT,
    plan_description TEXT,
    plan_features TEXT[],
    billing_frequency_months INT,
    price_id UUID,
    base_price_cop NUMERIC,
    extra_branch_price_cop NUMERIC,
    country_id UUID,
    country_name TEXT,
    calculated_price NUMERIC,
    calculated_extra_branch_price NUMERIC,
    currency_code TEXT,
    currency_symbol TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH current_prices AS (
        SELECT DISTINCT ON (subscription_plan_id)
            pp.id as price_id,
            pp.subscription_plan_id,
            pp.base_price_cop,
            pp.extra_branch_price_cop
        FROM public.plan_price_history pp
        WHERE pp.effective_date <= CURRENT_DATE
        ORDER BY pp.subscription_plan_id, pp.effective_date DESC
    ),
    country_rates AS (
        SELECT
            c.id AS cid,
            c.name AS cname,
            curr.code AS ccode,
            curr.symbol AS csymbol,
            er.rate AS usd_to_target_rate
        FROM public.countries c
        JOIN public.currencies curr ON c.default_currency_id = curr.id
        LEFT JOIN public.exchange_rates er ON curr.code = er.target_currency_code AND er.base_currency_code = 'USD'
        WHERE c.is_active = TRUE
    ),
    cop_usd_rate AS (
        SELECT rate FROM public.exchange_rates WHERE base_currency_code = 'USD' AND target_currency_code = 'COP' LIMIT 1
    )
    SELECT
        sp.id AS plan_id,
        sp.name AS plan_name,
        sp.description AS plan_description,
        sp.features AS plan_features,
        sp.billing_frequency_months,
        cp.price_id,
        cp.base_price_cop,
        cp.extra_branch_price_cop,
        cr.cid AS country_id,
        cr.cname AS country_name,
        CASE
            WHEN cr.ccode = 'COP' THEN cp.base_price_cop
            WHEN cr.usd_to_target_rate IS NULL OR (SELECT rate FROM cop_usd_rate) IS NULL THEN NULL
            ELSE floor(cp.base_price_cop / (SELECT rate FROM cop_usd_rate) * cr.usd_to_target_rate) + 0.99
        END AS calculated_price,
        CASE
            WHEN cr.ccode = 'COP' THEN cp.extra_branch_price_cop
            WHEN cr.usd_to_target_rate IS NULL OR (SELECT rate FROM cop_usd_rate) IS NULL THEN NULL
            ELSE floor(cp.extra_branch_price_cop / (SELECT rate FROM cop_usd_rate) * cr.usd_to_target_rate) + 0.99
        END AS calculated_extra_branch_price,
        cr.ccode AS currency_code,
        cr.csymbol AS currency_symbol
    FROM
        public.subscription_plans sp
    JOIN current_prices cp ON sp.id = cp.subscription_plan_id
    CROSS JOIN country_rates cr
    ORDER BY
        sp.display_order, cr.cname;
END;
$$;

COMMENT ON FUNCTION public.get_calculated_plan_prices() IS 'Fetches subscription plan prices, calculating them for active countries. Prices are based on COP and converted. If conversion rates are missing, non-COP prices will be null instead of raising an error.';

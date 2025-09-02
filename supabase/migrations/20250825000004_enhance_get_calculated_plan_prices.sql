-- MIGRATION: Enhance get_calculated_plan_prices with platform filtering and promotional prices.

DROP FUNCTION IF EXISTS public.get_calculated_plan_prices(UUID);
DROP FUNCTION IF EXISTS public.get_calculated_plan_prices(); -- Drop old version without params

CREATE OR REPLACE FUNCTION public.get_calculated_plan_prices(p_platform_id UUID)
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
    calculated_promotional_price NUMERIC, -- New column
    currency_code TEXT,
    currency_symbol TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH
    branch_asset AS (
        SELECT id FROM public.plan_assets WHERE asset_key = 'branch' LIMIT 1
    ),
    current_tariffs AS (
        SELECT DISTINCT ON (pt.subscription_plan_id)
            pt.id AS tariff_id,
            pt.subscription_plan_id,
            pt.base_price,
            pt.promotional_price, -- Get new column
            c.code AS base_currency_code,
            (SELECT tap.extra_unit_price
             FROM public.tariff_asset_prices tap
             WHERE tap.tariff_id = pt.id AND tap.asset_id = (SELECT id FROM branch_asset)
             LIMIT 1) AS extra_branch_price
        FROM public.price_tariffs pt
        JOIN public.currencies c ON pt.currency_id = c.id
        WHERE pt.effective_date <= CURRENT_DATE
        ORDER BY pt.subscription_plan_id, pt.effective_date DESC
    ),
    country_rates AS (
        SELECT
            c.id AS cid, c.name AS cname, curr.code AS ccode, curr.symbol AS csymbol,
            er.rate AS usd_to_target_rate
        FROM public.countries c
        JOIN public.currencies curr ON c.default_currency_id = curr.id
        LEFT JOIN public.exchange_rates er ON er.target_currency_code = curr.code AND er.base_currency_code = 'USD'
        WHERE c.is_active = TRUE
    ),
    rates_to_usd AS (
        SELECT base_currency_code, rate FROM public.exchange_rates WHERE target_currency_code = 'USD'
        UNION ALL SELECT 'USD' AS base_currency_code, 1.0 AS rate
    )
    SELECT
        sp.id AS plan_id, sp.name AS plan_name, sp.description AS plan_description, sp.features AS plan_features,
        sp.billing_frequency_months, ct.tariff_id AS price_id, ct.base_price AS base_price_cop,
        COALESCE(ct.extra_branch_price, 0) AS extra_branch_price_cop, cr.cid AS country_id, cr.cname AS country_name,
        floor(ct.base_price * (SELECT rate FROM rates_to_usd WHERE base_currency_code = ct.base_currency_code LIMIT 1) * cr.usd_to_target_rate) + 0.99 AS calculated_price,
        floor(COALESCE(ct.extra_branch_price, 0) * (SELECT rate FROM rates_to_usd WHERE base_currency_code = ct.base_currency_code LIMIT 1) * cr.usd_to_target_rate) + 0.99 AS calculated_extra_branch_price,
        floor(COALESCE(ct.promotional_price, 0) * (SELECT rate FROM rates_to_usd WHERE base_currency_code = ct.base_currency_code LIMIT 1) * cr.usd_to_target_rate) + 0.99 AS calculated_promotional_price,
        cr.ccode AS currency_code, cr.csymbol AS currency_symbol
    FROM
        public.subscription_plans sp
    CROSS JOIN country_rates cr
    LEFT JOIN current_tariffs ct ON sp.id = ct.subscription_plan_id
    WHERE
        sp.is_active = TRUE
        AND sp.platform_id = p_platform_id -- New filter
        AND sp.is_default_trial = false -- New filter
    ORDER BY
        sp.display_order, cr.cname;
END;
$$;

COMMENT ON FUNCTION public.get_calculated_plan_prices(UUID) IS 'Rebuilt to use the versioned tariff system. It now filters by platform, excludes trial plans, and calculates promotional prices.';

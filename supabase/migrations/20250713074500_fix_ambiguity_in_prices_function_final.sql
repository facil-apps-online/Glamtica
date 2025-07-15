-- Migración para corregir la ambigüedad de columnas en la función get_calculated_plan_prices (versión final)

DROP FUNCTION IF EXISTS get_calculated_plan_prices();

CREATE OR REPLACE FUNCTION get_calculated_plan_prices()
RETURNS TABLE (
    plan_id UUID,
    plan_name TEXT,
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
DECLARE
    cop_to_usd_rate NUMERIC;
BEGIN
    SELECT rate INTO cop_to_usd_rate FROM public.exchange_rates WHERE base_currency_code = 'USD' AND target_currency_code = 'COP';

    IF cop_to_usd_rate IS NULL THEN
        RAISE EXCEPTION 'La tasa de cambio para COP no está disponible en la caché.';
    END IF;

    RETURN QUERY
    WITH current_prices AS (
        -- CORREGIDO: Se especifica el origen de las columnas (pph) para evitar ambigüedad
        SELECT DISTINCT ON (pph.subscription_plan_id)
            pph.subscription_plan_id,
            pph.base_price_cop,
            pph.extra_branch_price_cop
        FROM public.plan_price_history pph
        WHERE pph.effective_date <= CURRENT_DATE
        ORDER BY pph.subscription_plan_id, pph.effective_date DESC
    ),
    country_rates AS (
        SELECT
            c.id AS cid,
            c.name AS cname,
            curr.code AS ccode,
            curr.symbol AS csymbol,
            er.rate AS usd_to_target_rate
        FROM public.countries c
        JOIN public.currencies curr ON c.currency_id = curr.id
        LEFT JOIN public.exchange_rates er ON curr.code = er.target_currency_code AND er.base_currency_code = 'USD'
        WHERE c.is_active = TRUE
    )
    SELECT
        sp.id,
        sp.name,
        cp.base_price_cop,
        cp.extra_branch_price_cop,
        cr.cid,
        cr.cname,
        CASE
            WHEN cr.ccode = 'COP' THEN cp.base_price_cop
            WHEN cr.usd_to_target_rate IS NULL THEN NULL
            ELSE floor(cp.base_price_cop / cop_to_usd_rate * cr.usd_to_target_rate) + 0.99
        END,
        CASE
            WHEN cr.ccode = 'COP' THEN cp.extra_branch_price_cop
            WHEN cr.usd_to_target_rate IS NULL THEN NULL
            ELSE floor(cp.extra_branch_price_cop / cop_to_usd_rate * cr.usd_to_target_rate) + 0.99
        END,
        cr.ccode,
        cr.csymbol
    FROM
        public.subscription_plans sp
    JOIN current_prices cp ON sp.id = cp.subscription_plan_id
    CROSS JOIN country_rates cr
    ORDER BY
        sp.display_order, cr.cname;
END;
$$;

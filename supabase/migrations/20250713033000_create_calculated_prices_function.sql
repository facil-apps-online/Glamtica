-- Migración para crear la función RPC get_calculated_plan_prices
-- Esta función calcula los precios de los planes para todos los países activos
-- basándose en el precio en COP y las tasas de cambio cacheadas.

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
    -- Obtener la tasa de cambio de COP a USD, que usaremos como puente
    SELECT rate INTO cop_to_usd_rate FROM public.exchange_rates WHERE base_currency_code = 'USD' AND target_currency_code = 'COP';

    IF cop_to_usd_rate IS NULL THEN
        RAISE EXCEPTION 'No se encontró la tasa de cambio para COP. Ejecute la función de actualización de tasas.';
    END IF;

    RETURN QUERY
    WITH country_rates AS (
        -- Subconsulta para obtener la tasa de cada moneda contra USD
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
    -- Cruzar todos los planes con todos los países y sus tasas
    SELECT
        sp.id AS plan_id,
        sp.name AS plan_name,
        sp.base_price_cop,
        sp.extra_branch_price_cop,
        cr.cid AS country_id,
        cr.cname AS country_name,
        -- Aplicar la lógica de cálculo y redondeo
        CASE
            -- Si el país es Colombia, el precio es el base en COP
            WHEN cr.ccode = 'COP' THEN sp.base_price_cop
            -- Si no, calcular, redondear y aplicar la regla .99
            ELSE floor(sp.base_price_cop / cop_to_usd_rate * cr.usd_to_target_rate) + 0.99
        END AS calculated_price,
        CASE
            WHEN cr.ccode = 'COP' THEN sp.extra_branch_price_cop
            ELSE floor(sp.extra_branch_price_cop / cop_to_usd_rate * cr.usd_to_target_rate) + 0.99
        END AS calculated_extra_branch_price,
        cr.ccode AS currency_code,
        cr.csymbol AS currency_symbol
    FROM
        public.subscription_plans sp,
        country_rates cr
    ORDER BY
        sp.billing_frequency_months, cr.cname;
END;
$$;

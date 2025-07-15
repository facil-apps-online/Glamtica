DROP FUNCTION IF EXISTS public.get_calculated_plan_prices();

CREATE OR REPLACE FUNCTION public.get_calculated_plan_prices()
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
    var_cop_to_usd_rate NUMERIC;
BEGIN
    -- Obtener la tasa de cambio de USD a COP. La API nos da tasas con base USD.
    SELECT rate INTO var_cop_to_usd_rate FROM public.exchange_rates WHERE base_currency_code = 'USD' AND target_currency_code = 'COP';

    IF var_cop_to_usd_rate IS NULL THEN
        RAISE EXCEPTION 'La tasa de cambio para COP no está disponible en la caché. Por favor, ejecute la función de actualización de tasas (update-exchange-rates).';
    END IF;

    RETURN QUERY
    WITH current_prices AS (
        -- Subconsulta para obtener el precio vigente más reciente para cada plan
        SELECT DISTINCT ON (subscription_plan_id)
            pp.subscription_plan_id,
            pp.base_price_cop,
            pp.extra_branch_price_cop
        FROM public.plan_price_history pp
        WHERE pp.effective_date <= CURRENT_DATE
        ORDER BY pp.subscription_plan_id, pp.effective_date DESC
    ),
    country_rates AS (
        -- Subconsulta para obtener la tasa de cada moneda contra USD
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
    )
    -- Cruzar todos los planes con sus precios vigentes y todos los países con sus tasas
    SELECT
        sp.id AS plan_id,
        sp.name AS plan_name,
        cp.base_price_cop,
        cp.extra_branch_price_cop,
        cr.cid AS country_id,
        cr.cname AS country_name,
        -- Aplicar la lógica de cálculo y redondeo
        CASE
            -- Si el país es Colombia, el precio es el base en COP
            WHEN cr.ccode = 'COP' THEN cp.base_price_cop
            -- Si no hay tasa para el país de destino, devolver NULL para indicar un problema
            WHEN cr.usd_to_target_rate IS NULL THEN NULL
            -- Si no, calcular, redondear y aplicar la regla .99
            ELSE floor(cp.base_price_cop / var_cop_to_usd_rate * cr.usd_to_target_rate) + 0.99
        END AS calculated_price,
        CASE
            WHEN cr.ccode = 'COP' THEN cp.extra_branch_price_cop
            WHEN cr.usd_to_target_rate IS NULL THEN NULL
            ELSE floor(cp.extra_branch_price_cop / var_cop_to_usd_rate * cr.usd_to_target_rate) + 0.99
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
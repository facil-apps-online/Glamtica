-- Migración para actualizar la función get_subscription_plans_for_user
-- para que devuelva los nuevos campos de la función subyacente.

DROP FUNCTION IF EXISTS public.get_subscription_plans_for_user(UUID);

CREATE OR REPLACE FUNCTION public.get_subscription_plans_for_user(
    p_user_id UUID
)
RETURNS TABLE (
    plan_id UUID,
    plan_name TEXT,
    plan_description TEXT,
    plan_features TEXT[],
    price_id UUID,
    calculated_price NUMERIC,
    currency_code TEXT,
    currency_symbol TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_tenant_id UUID;
    v_country_id UUID;
BEGIN
    -- 1. Obtener el tenant_id del usuario.
    SELECT tenant_id INTO v_tenant_id
    FROM public.users
    WHERE id = p_user_id;

    IF v_tenant_id IS NULL THEN
        RAISE EXCEPTION 'No se pudo encontrar un tenant para el usuario con ID: %', p_user_id;
    END IF;

    -- 2. Obtener el country_id del tenant.
    SELECT country_id INTO v_country_id
    FROM public.tenants
    WHERE id = v_tenant_id;

    IF v_country_id IS NULL THEN
        RAISE EXCEPTION 'No se pudo encontrar un país para el tenant con ID: %', v_tenant_id;
    END IF;

    -- 3. Llamar a la función existente y filtrar por el país del tenant.
    RETURN QUERY
    SELECT
        gcp.plan_id,
        gcp.plan_name,
        gcp.plan_description,
        gcp.plan_features,
        gcp.price_id,
        gcp.calculated_price,
        gcp.currency_code,
        gcp.currency_symbol
    FROM
        public.get_calculated_plan_prices() gcp
    WHERE
        gcp.country_id = v_country_id;
END;
$$;

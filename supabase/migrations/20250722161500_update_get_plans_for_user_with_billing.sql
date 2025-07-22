-- Migración para actualizar la función get_subscription_plans_for_user
-- para que devuelva el nuevo campo de frecuencia de facturación.

DROP FUNCTION IF EXISTS public.get_subscription_plans_for_user(UUID);

CREATE OR REPLACE FUNCTION public.get_subscription_plans_for_user(
    p_user_id UUID
)
RETURNS TABLE (
    plan_id UUID,
    plan_name TEXT,
    plan_description TEXT,
    plan_features TEXT[],
    billing_frequency_months INT, -- Campo añadido
    price_id UUID,
    calculated_price NUMERIC,
    calculated_extra_branch_price NUMERIC, -- Campo añadido
    currency_code TEXT,
    currency_symbol TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_tenant_id UUID;
    v_country_id UUID;
BEGIN
    -- Lógica para obtener el país del tenant (sin cambios)
    SELECT tenant_id INTO v_tenant_id FROM public.users WHERE id = p_user_id;
    IF v_tenant_id IS NULL THEN RAISE EXCEPTION 'Tenant no encontrado para el usuario: %', p_user_id; END IF;
    SELECT country_id INTO v_country_id FROM public.tenants WHERE id = v_tenant_id;
    IF v_country_id IS NULL THEN RAISE EXCEPTION 'País no encontrado para el tenant: %', v_tenant_id; END IF;

    -- Llamar a la función principal y devolver los campos actualizados
    RETURN QUERY
    SELECT
        gcp.plan_id,
        gcp.plan_name,
        gcp.plan_description,
        gcp.plan_features,
        gcp.billing_frequency_months, -- Campo añadido
        gcp.price_id,
        gcp.calculated_price,
        gcp.calculated_extra_branch_price, -- Campo añadido
        gcp.currency_code,
        gcp.currency_symbol
    FROM
        public.get_calculated_plan_prices() gcp
    WHERE
        gcp.country_id = v_country_id;
END;
$$;

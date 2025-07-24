-- MIGRATION: Refactor plan fetching logic to be tenant-based instead of user-based.

-- 1. Drop the old user-based function
DROP FUNCTION IF EXISTS public.get_subscription_plans_for_user(UUID);

-- 2. Create the new tenant-based function
CREATE OR REPLACE FUNCTION public.get_subscription_plans_for_tenant(
    p_tenant_id UUID
)
RETURNS TABLE (
    plan_id UUID,
    plan_name TEXT,
    plan_description TEXT,
    plan_features TEXT[],
    billing_frequency_months INT,
    price_id UUID,
    calculated_price NUMERIC,
    calculated_extra_branch_price NUMERIC,
    currency_code TEXT,
    currency_symbol TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_country_id UUID;
BEGIN
    -- Get the tenant's country to filter prices
    SELECT country_id INTO v_country_id FROM public.tenants WHERE id = p_tenant_id;
    IF v_country_id IS NULL THEN 
        RAISE EXCEPTION 'País no encontrado para el tenant: %', p_tenant_id; 
    END IF;

    -- Call the main pricing function and return all necessary fields
    RETURN QUERY
    SELECT
        gcp.plan_id,
        gcp.plan_name,
        gcp.plan_description,
        gcp.plan_features,
        gcp.billing_frequency_months,
        gcp.price_id,
        gcp.calculated_price,
        gcp.calculated_extra_branch_price,
        gcp.currency_code,
        gcp.currency_symbol
    FROM
        public.get_calculated_plan_prices() gcp
    WHERE
        gcp.country_id = v_country_id;
END;
$$;

COMMENT ON FUNCTION public.get_subscription_plans_for_tenant(UUID) IS 'Fetches available subscription plans and their calculated prices for a specific tenant, based on the tenant''s country.';

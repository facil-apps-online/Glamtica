-- MIGRATION: Update get_subscription_plans_for_tenant to return a price breakdown.

DROP FUNCTION IF EXISTS public.get_subscription_plans_for_tenant(UUID);

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
    currency_symbol TEXT,
    base_price NUMERIC, -- New field for price breakdown
    active_branches_count INT -- New field for price breakdown
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_country_id UUID;
    v_active_branch_assets_count INT;
    v_current_subscription_id UUID;
BEGIN
    -- Get the tenant's country to filter prices
    SELECT country_id INTO v_country_id FROM public.tenants WHERE id = p_tenant_id;
    IF v_country_id IS NULL THEN 
        RAISE EXCEPTION 'País no encontrado para el tenant: %', p_tenant_id; 
    END IF;

    -- Find the current active subscription for the tenant
    SELECT id INTO v_current_subscription_id
    FROM public.tenant_subscriptions
    WHERE tenant_id = p_tenant_id
    ORDER BY end_date DESC NULLS FIRST
    LIMIT 1;

    -- Count active branch assets for the current subscription
    IF v_current_subscription_id IS NOT NULL THEN
        SELECT count(*)::INT INTO v_active_branch_assets_count
        FROM public.subscription_assets
        WHERE tenant_subscription_id = v_current_subscription_id
          AND asset_type = 'branch'
          AND status = 'active';
    ELSE
        v_active_branch_assets_count := 0;
    END IF;

    -- Call the main pricing function and return the full breakdown
    RETURN QUERY
    SELECT
        gcp.plan_id,
        gcp.plan_name,
        gcp.plan_description,
        gcp.plan_features,
        gcp.billing_frequency_months,
        gcp.price_id,
        -- The final price is the plan's base price + (cost of extra branches * number of active branch assets)
        (gcp.calculated_price + (v_active_branch_assets_count * gcp.calculated_extra_branch_price)) AS calculated_price,
        gcp.calculated_extra_branch_price,
        gcp.currency_code,
        gcp.currency_symbol,
        gcp.calculated_price AS base_price, -- Return the plan's base price separately
        v_active_branch_assets_count AS active_branches_count -- Return the count used for the calculation
    FROM
        public.get_calculated_plan_prices() gcp
    WHERE
        gcp.country_id = v_country_id;
END;
$$;

COMMENT ON FUNCTION public.get_subscription_plans_for_tenant(UUID) IS 'Fetches available subscription plans and calculates their final prices for a specific tenant, including a breakdown of the base price and active branch assets.';

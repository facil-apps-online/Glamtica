-- MIGRATION: Update get_subscription_plans_for_tenant to support platform filtering and promotional prices.

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
    calculated_promotional_price NUMERIC, -- New column
    currency_code TEXT,
    currency_symbol TEXT,
    base_price NUMERIC,
    active_branches_count INT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_country_id UUID;
    v_platform_id UUID; -- New variable
    v_active_branch_assets_count INT;
    v_current_subscription_id UUID;
BEGIN
    -- Get the tenant's country and platform to filter prices and plans
    SELECT country_id, platform_id INTO v_country_id, v_platform_id FROM public.tenants WHERE id = p_tenant_id;
    
    IF v_country_id IS NULL THEN 
        RAISE EXCEPTION 'País no encontrado para el tenant: %', p_tenant_id; 
    END IF;
    IF v_platform_id IS NULL THEN 
        RAISE EXCEPTION 'Plataforma no encontrada para el tenant: %', p_tenant_id; 
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

    -- Call the main pricing function with the platform_id
    RETURN QUERY
    SELECT
        gcp.plan_id,
        gcp.plan_name,
        gcp.plan_description,
        gcp.plan_features,
        gcp.billing_frequency_months,
        gcp.price_id,
        (gcp.calculated_price + (v_active_branch_assets_count * gcp.calculated_extra_branch_price)) AS calculated_price,
        gcp.calculated_extra_branch_price,
        gcp.calculated_promotional_price, -- Pass through the new column
        gcp.currency_code,
        gcp.currency_symbol,
        gcp.calculated_price AS base_price,
        v_active_branch_assets_count AS active_branches_count
    FROM
        public.get_calculated_plan_prices(v_platform_id) gcp -- Pass platform_id
    WHERE
        gcp.country_id = v_country_id;
END;
$$;

COMMENT ON FUNCTION public.get_subscription_plans_for_tenant(UUID) IS 'Fetches available subscription plans for a tenant, now filtered by platform and including promotional prices.';

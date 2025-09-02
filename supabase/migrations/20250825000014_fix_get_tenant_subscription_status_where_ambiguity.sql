CREATE OR REPLACE FUNCTION public.get_tenant_subscription_status(p_tenant_id UUID)
RETURNS TABLE(status TEXT, end_date TIMESTAMPTZ, plan_name TEXT)
LANGUAGE plpgsql
AS $$
DECLARE
    v_current_active_subscription RECORD;
    v_latest_subscription RECORD;
    v_plan_name TEXT;
    v_is_system_owner BOOLEAN;
BEGIN
    -- Check if the tenant is the system owner
    SELECT is_system_owner INTO v_is_system_owner
    FROM public.tenants
    WHERE id = p_tenant_id;

    IF v_is_system_owner IS TRUE THEN
        RETURN QUERY SELECT 'activo'::TEXT, NULL::TIMESTAMPTZ, 'System Owner'::TEXT;
        RETURN;
    END IF;

    -- 1. Try to find a currently active subscription
    SELECT ts.* INTO v_current_active_subscription
    FROM public.tenant_subscriptions ts
    WHERE ts.tenant_id = p_tenant_id
      AND NOW() >= ts.start_date
      AND (ts.end_date IS NULL OR NOW() <= ts.end_date)
    ORDER BY ts.start_date DESC -- In case of overlaps, pick the one that started most recently
    LIMIT 1;

    IF v_current_active_subscription IS NOT NULL THEN
        -- An active subscription is found
        SELECT name INTO v_plan_name
        FROM public.subscription_plans
        WHERE id = v_current_active_subscription.subscription_plan_id;

        RETURN QUERY SELECT 'activo'::TEXT, v_current_active_subscription.end_date::TIMESTAMPTZ, v_plan_name::TEXT;
        RETURN;
    END IF;

    -- 2. If no active subscription, find the latest subscription (active or expired) to determine grace/suspended/canceled
    SELECT ts.* INTO v_latest_subscription
    FROM public.tenant_subscriptions ts
    WHERE ts.tenant_id = p_tenant_id
    ORDER BY ts.end_date DESC NULLS FIRST, ts.created_at DESC
    LIMIT 1;

    IF v_latest_subscription IS NULL THEN
        -- No subscriptions ever found for this tenant
        RETURN QUERY SELECT 'cancelado'::TEXT, NULL::TIMESTAMPTZ, NULL::TEXT;
        RETURN;
    END IF;

    -- Get the plan name for the latest subscription
    SELECT name INTO v_plan_name
    FROM public.subscription_plans
    WHERE id = v_latest_subscription.subscription_plan_id;

    -- Calculate status based on the latest subscription's end_date
    RETURN QUERY
    SELECT
        CASE
            WHEN v_latest_subscription.end_date IS NULL THEN 'activo'::TEXT -- Should have been caught by v_current_active_subscription, but as a fallback
            WHEN NOW() >= v_latest_subscription.start_date AND NOW() <= v_latest_subscription.end_date THEN 'activo'::TEXT -- Should have been caught by v_current_active_subscription, but as a fallback
            WHEN NOW() > v_latest_subscription.end_date AND NOW() <= (v_latest_subscription.end_date + '3 days'::interval) THEN 'gracia'::TEXT
            WHEN NOW() > (v_latest_subscription.end_date + '3 days'::interval) AND NOW() <= (v_latest_subscription.end_date + '3 months'::interval) THEN 'suspendido'::TEXT
            ELSE 'cancelado'::TEXT
        END AS status,
        v_latest_subscription.end_date::TIMESTAMPTZ,
        v_plan_name::TEXT;
END;
$$;

COMMENT ON FUNCTION public.get_tenant_subscription_status(UUID) IS 'Returns the calculated status, end date, and plan name for a tenant''s latest subscription, prioritizing truly active ones and handling system owner.';

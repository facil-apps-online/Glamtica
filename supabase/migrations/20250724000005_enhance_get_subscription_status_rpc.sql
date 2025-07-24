-- MIGRATION: Enhance get_tenant_subscription_status to include the plan name.

DROP FUNCTION IF EXISTS public.get_tenant_subscription_status(UUID);

CREATE OR REPLACE FUNCTION public.get_tenant_subscription_status(p_tenant_id UUID)
RETURNS TABLE(status TEXT, end_date TIMESTAMPTZ, plan_name TEXT) -- Add plan_name to the return table
LANGUAGE plpgsql
AS $$
DECLARE
    v_last_subscription RECORD;
    v_plan_name TEXT;
    OWNER_TENANT_ID UUID := '00000000-0000-0000-0000-000000000000';
BEGIN
    -- Special case for the system owner tenant
    IF p_tenant_id = OWNER_TENANT_ID THEN
        RETURN QUERY SELECT 'activo'::TEXT, NULL::TIMESTAMPTZ, 'System Owner'::TEXT;
        RETURN;
    END IF;

    -- Find the latest subscription
    SELECT * INTO v_last_subscription
    FROM public.tenant_subscriptions
    WHERE tenant_id = p_tenant_id
    ORDER BY end_date DESC NULLS FIRST;

    -- If no subscription is found, return 'cancelado'
    IF v_last_subscription IS NULL THEN
        RETURN QUERY SELECT 'cancelado'::TEXT, NULL::TIMESTAMPTZ, NULL::TEXT;
        RETURN;
    END IF;

    -- Get the plan name
    SELECT name INTO v_plan_name
    FROM public.subscription_plans
    WHERE id = v_last_subscription.subscription_plan_id;

    -- Return the calculated status, end date, and plan name
    RETURN QUERY
    SELECT
        CASE
            WHEN v_last_subscription.end_date IS NULL THEN 'activo'::TEXT
            WHEN NOW() >= v_last_subscription.start_date AND NOW() <= v_last_subscription.end_date THEN 'activo'::TEXT
            WHEN NOW() > v_last_subscription.end_date AND NOW() <= (v_last_subscription.end_date + '3 days'::interval) THEN 'gracia'::TEXT
            WHEN NOW() > (v_last_subscription.end_date + '3 days'::interval) AND NOW() <= (v_last_subscription.end_date + '3 months'::interval) THEN 'suspendido'::TEXT
            ELSE 'cancelado'::TEXT
        END AS status,
        v_last_subscription.end_date,
        v_plan_name;
END;
$$;

COMMENT ON FUNCTION public.get_tenant_subscription_status(UUID) IS 'Returns the calculated status, end date, and plan name for a tenant''s latest subscription.';

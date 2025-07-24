-- MIGRATION: Refactor activate_branch with simplified subscription query

DROP FUNCTION IF EXISTS public.activate_branch(UUID, UUID);
CREATE OR REPLACE FUNCTION public.activate_branch(p_tenant_id UUID, p_branch_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_branch RECORD;
    v_subscription RECORD;
    v_plan RECORD;
    v_subscription_status TEXT;
    v_days_in_cycle INT;
    v_days_remaining INT;
    v_daily_rate NUMERIC;
    v_prorated_amount NUMERIC;
BEGIN
    -- Step 1: Verify the tenant has an active subscription using the status function
    SELECT status INTO v_subscription_status FROM public.get_tenant_subscription_status(p_tenant_id);
    IF v_subscription_status != 'activo' THEN
        RAISE EXCEPTION 'Cannot activate branch. Tenant subscription status is: %', v_subscription_status;
    END IF;

    -- Step 2: Validate the branch to be activated
    SELECT * INTO v_branch FROM public.branches WHERE id = p_branch_id AND tenant_id = p_tenant_id;
    IF v_branch IS NULL THEN RAISE EXCEPTION 'Branch not found or access denied for this tenant'; END IF;
    IF v_branch.status <> 'pending_activation' THEN RAISE EXCEPTION 'Branch is not pending activation'; END IF;

    -- Step 3: Get the latest subscription record directly to find plan and dates for proration
    SELECT * INTO v_subscription 
    FROM public.tenant_subscriptions 
    WHERE tenant_id = p_tenant_id 
    ORDER BY end_date DESC NULLS FIRST 
    LIMIT 1;
    
    IF v_subscription IS NULL THEN RAISE EXCEPTION 'No subscription record found to calculate proration'; END IF;

    -- Step 4: Get plan details from the subscription
    SELECT * INTO v_plan FROM public.subscription_plans WHERE id = v_subscription.plan_id;
    IF v_plan IS NULL OR v_plan.branch_price IS NULL OR v_plan.branch_price <= 0 THEN RAISE EXCEPTION 'Invalid plan or branch price is not set'; END IF;

    -- Step 5: Calculate proration
    -- Handle permanent subscriptions (end_date is NULL)
    IF v_subscription.end_date IS NULL THEN
        v_prorated_amount := v_plan.branch_price; -- Or handle as a full charge, depending on business logic
    ELSE
        v_days_in_cycle := v_subscription.end_date::date - v_subscription.start_date::date;
        v_days_remaining := v_subscription.end_date::date - NOW()::date;
        v_prorated_amount := 0;
        IF v_days_remaining > 0 AND v_days_in_cycle > 0 THEN
            v_daily_rate := v_plan.branch_price / v_days_in_cycle;
            v_prorated_amount := v_daily_rate * v_days_remaining;
        END IF;
    END IF;

    -- Step 6: Activate the branch and create the subscription asset
    UPDATE public.branches SET status = 'active', activated_at = NOW() WHERE id = p_branch_id;
    INSERT INTO public.subscription_assets (tenant_subscription_id, asset_type, asset_reference_id, status, price_at_addition)
    VALUES (v_subscription.id, 'branch', p_branch_id, 'active', v_plan.branch_price);

    RETURN jsonb_build_object('success', true, 'prorated_amount_charged', round(v_prorated_amount, 2));
END;
$$;

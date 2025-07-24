-- MIGRATION: Create RPC function to activate a branch and calculate proration

CREATE OR REPLACE FUNCTION public.activate_branch(
    p_branch_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tenant_id UUID;
    v_branch record;
    v_subscription record;
    v_plan record;
    v_days_in_cycle INT;
    v_days_remaining INT;
    v_daily_rate NUMERIC;
    v_prorated_amount NUMERIC;
    v_response JSONB;
BEGIN
    -- 1. Get tenant_id from JWT and validate the branch
    SELECT jwt.claims->>'tenant_id' INTO v_tenant_id FROM auth.jwt() jwt;
    IF v_tenant_id IS NULL THEN
        RAISE EXCEPTION 'Tenant ID not found in JWT claims';
    END IF;

    SELECT * INTO v_branch FROM public.branches
    WHERE id = p_branch_id AND tenant_id = v_tenant_id;

    IF v_branch IS NULL THEN
        RAISE EXCEPTION 'Branch not found or access denied';
    END IF;

    IF v_branch.status <> 'pending_activation' THEN
        RAISE EXCEPTION 'Branch is not pending activation. Current status: %', v_branch.status;
    END IF;

    -- 2. Get active subscription and plan details
    SELECT * INTO v_subscription FROM public.tenant_subscriptions
    WHERE tenant_id = v_tenant_id AND status = 'active'
    ORDER BY created_at DESC LIMIT 1;

    IF v_subscription IS NULL THEN
        RAISE EXCEPTION 'No active subscription found for this tenant';
    END IF;

    SELECT * INTO v_plan FROM public.subscription_plans
    WHERE id = v_subscription.plan_id;

    IF v_plan IS NULL OR v_plan.branch_price IS NULL OR v_plan.branch_price <= 0 THEN
        RAISE EXCEPTION 'Invalid plan or branch price not set';
    END IF;

    -- 3. Calculate proration
    v_days_in_cycle := v_subscription.current_period_end::date - v_subscription.current_period_start::date;
    v_days_remaining := v_subscription.current_period_end::date - NOW()::date;

    IF v_days_remaining <= 0 THEN
        -- No proration needed if activating on the last day or after cycle end
        v_prorated_amount := 0;
    ELSE
        v_daily_rate := v_plan.branch_price / v_days_in_cycle;
        v_prorated_amount := v_daily_rate * v_days_remaining;
    END IF;

    -- 4. *** PAYMENT GATEWAY LOGIC SIMULATION ***
    -- In a real scenario, you would return this amount to the frontend,
    -- process payment, and run the activation logic in a separate, secure webhook.
    -- For now, we proceed directly to activation.

    -- 5. Activate the branch and create the subscription asset
    UPDATE public.branches
    SET status = 'active', activated_at = NOW()
    WHERE id = p_branch_id;

    INSERT INTO public.subscription_assets (tenant_subscription_id, asset_type, asset_reference_id, status, price_at_addition)
    VALUES (v_subscription.id, 'branch', p_branch_id, 'active', v_plan.branch_price);

    -- 6. Prepare response
    v_response := jsonb_build_object(
        'success', true,
        'branch_id', p_branch_id,
        'new_status', 'active',
        'prorated_amount_charged', round(v_prorated_amount, 2),
        'days_remaining', v_days_remaining,
        'message', 'Branch activated successfully. Prorated amount will be charged.'
    );

    RETURN v_response;

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;

COMMENT ON FUNCTION public.activate_branch(UUID) IS 'Activates a branch, calculates prorated charge, and creates a subscription asset.';

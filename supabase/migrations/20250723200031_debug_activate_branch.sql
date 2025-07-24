-- MIGRATION: Add debug logging to activate_branch RPC

DROP FUNCTION IF EXISTS public.activate_branch(UUID, UUID);
CREATE OR REPLACE FUNCTION public.activate_branch(p_tenant_id UUID, p_branch_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_branch record;
    v_subscription record;
    v_plan record;
    v_days_in_cycle INT;
    v_days_remaining INT;
    v_daily_rate NUMERIC;
    v_prorated_amount NUMERIC;
BEGIN
    RAISE LOG '[activate_branch] Starting for tenant_id: %, branch_id: %', p_tenant_id, p_branch_id;

    SELECT * INTO v_branch FROM public.branches WHERE id = p_branch_id AND tenant_id = p_tenant_id;
    IF v_branch IS NULL THEN RAISE EXCEPTION 'DEBUG: Branch not found or access denied'; END IF;
    RAISE LOG '[activate_branch] Found branch: %', v_branch.id;

    IF v_branch.status <> 'pending_activation' THEN RAISE EXCEPTION 'DEBUG: Branch not pending activation, status is %', v_branch.status; END IF;
    RAISE LOG '[activate_branch] Branch status is pending_activation.';

    SELECT * INTO v_subscription FROM public.tenant_subscriptions WHERE tenant_id = p_tenant_id AND status = 'active' ORDER BY created_at DESC LIMIT 1;
    IF v_subscription IS NULL THEN RAISE EXCEPTION 'DEBUG: No active subscription found'; END IF;
    RAISE LOG '[activate_branch] Found active subscription: %', v_subscription.id;

    SELECT * INTO v_plan FROM public.subscription_plans WHERE id = v_subscription.plan_id;
    IF v_plan IS NULL THEN RAISE EXCEPTION 'DEBUG: Subscription plan not found'; END IF;
    RAISE LOG '[activate_branch] Found plan: %', v_plan.name;

    IF v_plan.branch_price IS NULL OR v_plan.branch_price <= 0 THEN RAISE EXCEPTION 'DEBUG: Invalid plan or branch price is zero or null'; END IF;
    RAISE LOG '[activate_branch] Branch price: %', v_plan.branch_price;

    v_days_in_cycle := v_subscription.current_period_end::date - v_subscription.current_period_start::date;
    v_days_remaining := v_subscription.current_period_end::date - NOW()::date;
    RAISE LOG '[activate_branch] Days in cycle: %, Days remaining: %', v_days_in_cycle, v_days_remaining;

    v_prorated_amount := 0;
    IF v_days_remaining > 0 AND v_days_in_cycle > 0 THEN
        v_daily_rate := v_plan.branch_price / v_days_in_cycle;
        v_prorated_amount := v_daily_rate * v_days_remaining;
    END IF;
    RAISE LOG '[activate_branch] Calculated prorated amount: %', v_prorated_amount;

    UPDATE public.branches SET status = 'active', activated_at = NOW() WHERE id = p_branch_id;
    RAISE LOG '[activate_branch] Branch status updated to active.';

    INSERT INTO public.subscription_assets (tenant_subscription_id, asset_type, asset_reference_id, status, price_at_addition)
    VALUES (v_subscription.id, 'branch', p_branch_id, 'active', v_plan.branch_price);
    RAISE LOG '[activate_branch] Subscription asset created.';

    RETURN jsonb_build_object('success', true, 'prorated_amount_charged', round(v_prorated_amount, 2));
END;
$$;

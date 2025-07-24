-- MIGRATION: Refactor all branches RPCs to accept explicit security parameters

-- ========= 1. GET_TENANT_BRANCHES (READ) =========
DROP FUNCTION IF EXISTS public.get_tenant_branches();
CREATE OR REPLACE FUNCTION public.get_tenant_branches(p_tenant_id UUID)
RETURNS SETOF public.branches
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT *
  FROM public.branches
  WHERE tenant_id = p_tenant_id
  ORDER BY is_main_branch DESC, name ASC;
$$;

-- ========= 2. CREATE_BRANCH (CREATE) =========
DROP FUNCTION IF EXISTS public.create_branch(TEXT, TEXT);
CREATE OR REPLACE FUNCTION public.create_branch(p_tenant_id UUID, p_name TEXT, p_address TEXT DEFAULT NULL)
RETURNS public.branches
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_branch public.branches;
BEGIN
    INSERT INTO public.branches (tenant_id, name, address, is_main_branch)
    VALUES (p_tenant_id, p_name, p_address, false)
    RETURNING * INTO new_branch;
    RETURN new_branch;
END;
$$;

-- ========= 3. UPDATE_BRANCH (UPDATE) =========
DROP FUNCTION IF EXISTS public.update_branch(UUID, TEXT, TEXT);
CREATE OR REPLACE FUNCTION public.update_branch(p_tenant_id UUID, p_branch_id UUID, p_name TEXT, p_address TEXT)
RETURNS public.branches
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    updated_branch public.branches;
BEGIN
    UPDATE public.branches SET name = p_name, address = p_address, updated_at = NOW()
    WHERE id = p_branch_id AND tenant_id = p_tenant_id
    RETURNING * INTO updated_branch;
    IF updated_branch IS NULL THEN RAISE EXCEPTION 'Branch not found or access denied for this tenant'; END IF;
    RETURN updated_branch;
END;
$$;

-- ========= 4. DELETE_BRANCH (DELETE) =========
DROP FUNCTION IF EXISTS public.delete_branch(UUID);
CREATE OR REPLACE FUNCTION public.delete_branch(p_tenant_id UUID, p_branch_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_branch record;
BEGIN
    SELECT * INTO v_branch FROM public.branches WHERE id = p_branch_id AND tenant_id = p_tenant_id;
    IF v_branch IS NULL THEN RAISE EXCEPTION 'Branch not found or access denied for this tenant'; END IF;
    IF v_branch.is_main_branch THEN RAISE EXCEPTION 'Cannot delete the main branch'; END IF;
    DELETE FROM public.branches WHERE id = p_branch_id;
    RETURN jsonb_build_object('success', true, 'message', 'Branch deleted successfully');
END;
$$;

-- ========= 5. ACTIVATE_BRANCH (Custom Logic) =========
DROP FUNCTION IF EXISTS public.activate_branch(UUID);
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
    SELECT * INTO v_branch FROM public.branches WHERE id = p_branch_id AND tenant_id = p_tenant_id;
    IF v_branch IS NULL THEN RAISE EXCEPTION 'Branch not found or access denied for this tenant'; END IF;
    IF v_branch.status <> 'pending_activation' THEN RAISE EXCEPTION 'Branch is not pending activation'; END IF;
    SELECT * INTO v_subscription FROM public.tenant_subscriptions WHERE tenant_id = p_tenant_id AND status = 'active' ORDER BY created_at DESC LIMIT 1;
    IF v_subscription IS NULL THEN RAISE EXCEPTION 'No active subscription found'; END IF;
    SELECT * INTO v_plan FROM public.subscription_plans WHERE id = v_subscription.plan_id;
    IF v_plan IS NULL OR v_plan.branch_price IS NULL OR v_plan.branch_price <= 0 THEN RAISE EXCEPTION 'Invalid plan or branch price'; END IF;
    v_days_in_cycle := v_subscription.current_period_end::date - v_subscription.current_period_start::date;
    v_days_remaining := v_subscription.current_period_end::date - NOW()::date;
    v_prorated_amount := 0;
    IF v_days_remaining > 0 AND v_days_in_cycle > 0 THEN
        v_daily_rate := v_plan.branch_price / v_days_in_cycle;
        v_prorated_amount := v_daily_rate * v_days_remaining;
    END IF;
    UPDATE public.branches SET status = 'active', activated_at = NOW() WHERE id = p_branch_id;
    INSERT INTO public.subscription_assets (tenant_subscription_id, asset_type, asset_reference_id, status, price_at_addition)
    VALUES (v_subscription.id, 'branch', p_branch_id, 'active', v_plan.branch_price);
    RETURN jsonb_build_object('success', true, 'prorated_amount_charged', round(v_prorated_amount, 2));
END;
$$;

-- ========= 6. ARCHIVE_BRANCH (Custom Logic) =========
DROP FUNCTION IF EXISTS public.archive_branch(UUID);
CREATE OR REPLACE FUNCTION public.archive_branch(p_tenant_id UUID, p_branch_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_branch record;
    v_subscription record;
BEGIN
    SELECT * INTO v_branch FROM public.branches WHERE id = p_branch_id AND tenant_id = p_tenant_id;
    IF v_branch IS NULL THEN RAISE EXCEPTION 'Branch not found or access denied for this tenant'; END IF;
    IF v_branch.is_main_branch THEN RAISE EXCEPTION 'Cannot archive the main branch'; END IF;
    IF v_branch.status <> 'active' THEN RAISE EXCEPTION 'Only active branches can be archived'; END IF;
    SELECT * INTO v_subscription FROM public.tenant_subscriptions WHERE tenant_id = p_tenant_id AND status = 'active' ORDER BY created_at DESC LIMIT 1;
    IF v_subscription IS NULL THEN RAISE EXCEPTION 'No active subscription found'; END IF;
    UPDATE public.branches SET status = 'archived' WHERE id = p_branch_id;
    UPDATE public.subscription_assets SET status = 'cancelled', cancelled_at = NOW()
    WHERE tenant_subscription_id = v_subscription.id AND asset_type = 'branch' AND asset_reference_id = p_branch_id AND status = 'active';
    RETURN jsonb_build_object('success', true, 'message', 'Branch archived');
END;
$$;

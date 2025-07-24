-- MIGRATION: Refactor archive_branch to use correct subscription logic

DROP FUNCTION IF EXISTS public.archive_branch(UUID, UUID);
CREATE OR REPLACE FUNCTION public.archive_branch(p_tenant_id UUID, p_branch_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_branch RECORD;
    v_subscription RECORD;
    v_subscription_status TEXT;
BEGIN
    -- Step 1: Verify the tenant has an active subscription
    SELECT status INTO v_subscription_status FROM public.get_tenant_subscription_status(p_tenant_id);
    IF v_subscription_status != 'activo' THEN
        RAISE EXCEPTION 'Cannot archive branch. Tenant subscription status is: %', v_subscription_status;
    END IF;

    -- Step 2: Validate the branch
    SELECT * INTO v_branch FROM public.branches WHERE id = p_branch_id AND tenant_id = p_tenant_id;
    IF v_branch IS NULL THEN RAISE EXCEPTION 'Branch not found or access denied for this tenant'; END IF;
    IF v_branch.is_main_branch THEN RAISE EXCEPTION 'Cannot archive the main branch'; END IF;
    IF v_branch.status <> 'active' THEN RAISE EXCEPTION 'Only active branches can be archived'; END IF;

    -- Step 3: Get the latest subscription record to find its ID
    SELECT * INTO v_subscription 
    FROM public.tenant_subscriptions 
    WHERE tenant_id = p_tenant_id 
    ORDER BY end_date DESC NULLS FIRST 
    LIMIT 1;
    
    IF v_subscription IS NULL THEN RAISE EXCEPTION 'No subscription record found'; END IF;

    -- Step 4: Archive the branch and cancel the corresponding subscription asset
    UPDATE public.branches SET status = 'archived' WHERE id = p_branch_id;
    
    UPDATE public.subscription_assets 
    SET 
        status = 'cancelled', 
        cancelled_at = NOW()
    WHERE 
        tenant_subscription_id = v_subscription.id 
        AND asset_type = 'branch' 
        AND asset_reference_id = p_branch_id 
        AND status = 'active';

    RETURN jsonb_build_object('success', true, 'message', 'Branch archived successfully');
END;
$$;

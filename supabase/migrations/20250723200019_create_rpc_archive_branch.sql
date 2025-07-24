-- MIGRATION: Create RPC function to archive a branch

CREATE OR REPLACE FUNCTION public.archive_branch(
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

    IF v_branch.is_main_branch THEN
        RAISE EXCEPTION 'Cannot archive the main branch';
    END IF;

    IF v_branch.status <> 'active' THEN
        RAISE EXCEPTION 'Only active branches can be archived. Current status: %', v_branch.status;
    END IF;

    -- 2. Get active subscription for the tenant
    SELECT * INTO v_subscription FROM public.tenant_subscriptions
    WHERE tenant_id = v_tenant_id AND status = 'active'
    ORDER BY created_at DESC LIMIT 1;

    IF v_subscription IS NULL THEN
        RAISE EXCEPTION 'No active subscription found for this tenant';
    END IF;

    -- 3. Update the branch status to 'archived'
    UPDATE public.branches
    SET status = 'archived'
    WHERE id = p_branch_id;

    -- 4. Update the corresponding subscription asset to 'cancelled'
    UPDATE public.subscription_assets
    SET
        status = 'cancelled',
        cancelled_at = NOW()
    WHERE
        tenant_subscription_id = v_subscription.id
        AND asset_type = 'branch'
        AND asset_reference_id = p_branch_id
        AND status = 'active';

    -- 5. Return success response
    RETURN jsonb_build_object(
        'success', true,
        'branch_id', p_branch_id,
        'new_status', 'archived',
        'message', 'Branch has been archived and will not be included in the next billing cycle.'
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;

COMMENT ON FUNCTION public.archive_branch(UUID) IS 'Archives a branch and cancels its corresponding subscription asset.';

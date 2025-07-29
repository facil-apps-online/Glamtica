CREATE OR REPLACE FUNCTION public.check_asset_limit(
    p_tenant_id UUID,
    p_asset_key TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_limit INT;
    v_current_count INT;
    v_plan_id UUID;
    v_asset_id UUID;
BEGIN
    -- Step 1: Find the tenant's active subscription plan
    SELECT active_plan_id INTO v_plan_id
    FROM public.tenant_subscriptions
    WHERE tenant_id = p_tenant_id
    AND status = 'active'
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_plan_id IS NULL THEN
        -- No active plan found, default to allowing the action
        RETURN TRUE;
    END IF;

    -- Step 2: Find the asset_id from the asset_key
    SELECT id INTO v_asset_id
    FROM public.plan_assets
    WHERE asset_key = p_asset_key
    -- This assumes asset_key is unique across platforms, or we need platform_id
    LIMIT 1;

    IF v_asset_id IS NULL THEN
        -- The asset type doesn't exist, so no limit is enforced
        RETURN TRUE;
    END IF;

    -- Step 3: Find the limit value for the plan and asset
    SELECT value::INT INTO v_limit
    FROM public.plan_asset_limits
    WHERE plan_id = v_plan_id AND asset_id = v_asset_id;

    IF v_limit IS NULL THEN
        -- No specific limit set for this asset in this plan, allow action
        RETURN TRUE;
    END IF;

    -- Step 4: Count the current number of resources based on the asset_key
    IF p_asset_key = 'max_branches' THEN
        SELECT COUNT(*)::INT INTO v_current_count
        FROM public.branches
        WHERE tenant_id = p_tenant_id;
    -- Add other cases here in the future
    -- ELSIF p_asset_key = 'max_users' THEN
    --     SELECT COUNT(*)::INT INTO v_current_count ...
    ELSE
        -- If the asset key is unknown, we don't enforce a limit
        RETURN TRUE;
    END IF;

    -- Step 5: Compare current count with the limit
    RETURN v_current_count < v_limit;
END;
$$;

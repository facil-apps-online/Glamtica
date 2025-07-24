-- MIGRATION: Create RPC function to activate multiple branches in a batch

CREATE OR REPLACE FUNCTION public.activate_branches_batch(p_tenant_id UUID, p_branch_ids UUID[])
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_branch_id UUID;
    v_branch RECORD;
    v_subscription RECORD;
    v_price_history RECORD;
    v_subscription_status TEXT;
    v_days_in_cycle INT;
    v_days_remaining INT;
    v_daily_rate NUMERIC;
    v_prorated_amount NUMERIC;
    v_branch_price NUMERIC;
    
    v_activated_count INT := 0;
    v_failed_count INT := 0;
    v_total_prorated_amount NUMERIC := 0;
    v_details JSONB[] := ARRAY[]::JSONB[];
    v_error_message TEXT;
BEGIN
    -- Step 1: Verify the tenant has an active subscription once
    SELECT status INTO v_subscription_status FROM public.get_tenant_subscription_status(p_tenant_id);
    IF v_subscription_status != 'activo' THEN
        RETURN jsonb_build_object(
            'success', false, 
            'message', 'Cannot activate branches. Tenant subscription status is: ' || v_subscription_status,
            'activated_count', 0,
            'failed_count', array_length(p_branch_ids, 1),
            'total_prorated_amount', 0,
            'details', '[]'::JSONB
        );
    END IF;

    -- Step 2: Get the latest subscription record once
    SELECT * INTO v_subscription 
    FROM public.tenant_subscriptions 
    WHERE tenant_id = p_tenant_id 
    ORDER BY end_date DESC NULLS FIRST 
    LIMIT 1;
    
    IF v_subscription IS NULL THEN 
        RETURN jsonb_build_object(
            'success', false, 
            'message', 'No active subscription record found for the tenant.',
            'activated_count', 0,
            'failed_count', array_length(p_branch_ids, 1),
            'total_prorated_amount', 0,
            'details', '[]'::JSONB
        );
    END IF;

    -- Step 3: Loop through each branch ID
    FOREACH v_branch_id IN ARRAY p_branch_ids
    LOOP
        BEGIN
            -- Step 3a: Validate the branch
            SELECT * INTO v_branch FROM public.branches WHERE id = v_branch_id AND tenant_id = p_tenant_id;
            IF v_branch IS NULL THEN RAISE EXCEPTION 'Branch not found or access denied'; END IF;
            IF v_branch.status <> 'pending_activation' THEN RAISE EXCEPTION 'Branch is not pending activation'; END IF;

            -- Step 3b: Get the price for the plan
            SELECT extra_branch_price_cop INTO v_branch_price
            FROM public.plan_price_history
            WHERE subscription_plan_id = v_subscription.subscription_plan_id AND effective_date <= NOW()
            ORDER BY effective_date DESC
            LIMIT 1;

            IF v_branch_price IS NULL OR v_branch_price <= 0 THEN 
                RAISE EXCEPTION 'Could not find a valid price for the branch.'; 
            END IF;

            -- Step 3c: Proration Calculation
            IF v_subscription.end_date IS NULL THEN
                RAISE EXCEPTION 'The current subscription has no end date.';
            ELSE
                v_days_in_cycle := v_subscription.end_date::date - v_subscription.start_date::date;
                v_days_remaining := v_subscription.end_date::date - NOW()::date;
                v_prorated_amount := 0;
                IF v_days_remaining > 0 AND v_days_in_cycle > 0 THEN
                    v_daily_rate := v_branch_price / v_days_in_cycle;
                    v_prorated_amount := v_daily_rate * v_days_remaining;
                END IF;
            END IF;

            -- Step 3d: Activate the branch and create the asset
            UPDATE public.branches SET status = 'active', activated_at = NOW() WHERE id = v_branch_id;
            INSERT INTO public.subscription_assets (tenant_subscription_id, asset_type, asset_reference_id, status, price_at_addition)
            VALUES (v_subscription.id, 'branch', v_branch_id, 'active', v_branch_price);

            -- Step 3e: Log success
            v_activated_count := v_activated_count + 1;
            v_total_prorated_amount := v_total_prorated_amount + round(v_prorated_amount, 2);
            v_details := array_append(v_details, jsonb_build_object(
                'branch_id', v_branch_id, 
                'status', 'success', 
                'amount_charged', round(v_prorated_amount, 2)
            ));

        EXCEPTION
            WHEN OTHERS THEN
                GET STACKED DIAGNOSTICS v_error_message = MESSAGE_TEXT;
                v_failed_count := v_failed_count + 1;
                v_details := array_append(v_details, jsonb_build_object(
                    'branch_id', v_branch_id, 
                    'status', 'failed', 
                    'error', v_error_message
                ));
        END;
    END LOOP;

    -- Step 4: Return the consolidated result
    RETURN jsonb_build_object(
        'success', v_failed_count = 0,
        'activated_count', v_activated_count,
        'failed_count', v_failed_count,
        'total_prorated_amount', v_total_prorated_amount,
        'details', to_jsonb(v_details)
    );
END;
$$;

COMMENT ON FUNCTION public.activate_branches_batch(UUID, UUID[]) IS 'Activates a batch of branches, calculates prorated charges, and creates corresponding subscription assets.';

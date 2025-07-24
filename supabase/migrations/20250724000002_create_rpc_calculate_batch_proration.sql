-- MIGRATION: Create RPC function to calculate prorated cost for batch branch activation

CREATE OR REPLACE FUNCTION public.calculate_batch_activation_proration(p_tenant_id UUID, p_branch_ids UUID[])
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_branch_id UUID;
    v_branch RECORD;
    v_subscription RECORD;
    v_subscription_status TEXT;
    v_days_in_cycle INT;
    v_days_remaining INT;
    v_daily_rate NUMERIC;
    v_prorated_amount NUMERIC;
    v_branch_price NUMERIC;
    
    v_total_prorated_amount NUMERIC := 0;
    v_details JSONB[] := ARRAY[]::JSONB[];
    v_error_message TEXT;
BEGIN
    -- Step 1: Verify the tenant has an active subscription
    SELECT status INTO v_subscription_status FROM public.get_tenant_subscription_status(p_tenant_id);
    IF v_subscription_status != 'activo' THEN
        RAISE EXCEPTION 'Cannot calculate cost. Tenant subscription status is: %', v_subscription_status;
    END IF;

    -- Step 2: Get the latest subscription record
    SELECT * INTO v_subscription 
    FROM public.tenant_subscriptions 
    WHERE tenant_id = p_tenant_id 
    ORDER BY end_date DESC NULLS FIRST 
    LIMIT 1;
    
    IF v_subscription IS NULL THEN 
        RAISE EXCEPTION 'No active subscription record found for the tenant.';
    END IF;

    -- Step 3: Loop through each branch ID to calculate cost
    FOREACH v_branch_id IN ARRAY p_branch_ids
    LOOP
        BEGIN
            -- Step 3a: Validate the branch
            SELECT * INTO v_branch FROM public.branches WHERE id = v_branch_id AND tenant_id = p_tenant_id;
            IF v_branch IS NULL THEN RAISE EXCEPTION 'Branch not found or access denied'; END IF;
            IF v_branch.status <> 'pending_activation' THEN RAISE EXCEPTION 'Branch % is not pending activation', v_branch.name; END IF;

            -- Step 3b: Get the price for the plan
            SELECT extra_branch_price_cop INTO v_branch_price
            FROM public.plan_price_history
            WHERE subscription_plan_id = v_subscription.subscription_plan_id AND effective_date <= NOW()
            ORDER BY effective_date DESC
            LIMIT 1;

            IF v_branch_price IS NULL OR v_branch_price <= 0 THEN 
                RAISE EXCEPTION 'Could not find a valid price for branch %.', v_branch.name; 
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

            -- Step 3d: Log details for this branch
            v_total_prorated_amount := v_total_prorated_amount + round(v_prorated_amount, 2);
            v_details := array_append(v_details, jsonb_build_object(
                'branch_id', v_branch_id, 
                'branch_name', v_branch.name,
                'prorated_amount', round(v_prorated_amount, 2)
            ));

        EXCEPTION
            WHEN OTHERS THEN
                GET STACKED DIAGNOSTICS v_error_message = MESSAGE_TEXT;
                -- In a calculation function, it's better to raise the error to the client
                RAISE EXCEPTION 'Failed to calculate for branch %: %', v_branch_id, v_error_message;
        END;
    END LOOP;

    -- Step 4: Return the consolidated calculation
    RETURN jsonb_build_object(
        'total_prorated_amount', v_total_prorated_amount,
        'details', to_jsonb(v_details)
    );
END;
$$;

COMMENT ON FUNCTION public.calculate_batch_activation_proration(UUID, UUID[]) IS 'Calculates the total prorated cost for activating a batch of branches without performing the activation.';

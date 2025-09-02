CREATE OR REPLACE FUNCTION public.get_subscription_status_for_tenant(
    p_tenant_id uuid
)
RETURNS TABLE(status text, end_date text, plan_name text)
LANGUAGE plpgsql
AS $$
DECLARE
    v_subscription RECORD;
BEGIN
    -- Find the subscription with the most recent end date (or nulls first for active ones)
    SELECT
        ts.end_date,
        ts.start_date,
        sp.name AS subscription_plan_name
    INTO
        v_subscription
    FROM
        public.tenant_subscriptions ts
    JOIN
        public.subscription_plans sp ON ts.subscription_plan_id = sp.id
    WHERE
        ts.tenant_id = p_tenant_id
    ORDER BY
        ts.end_date DESC NULLS FIRST
    LIMIT 1;

    IF v_subscription IS NULL THEN
        -- If no subscription is found, return a default 'cancelled' state
        RETURN QUERY SELECT 'cancelado'::text, NULL::text, NULL::text;
    ELSE
        -- Calculate status based on dates and return all required fields
        RETURN QUERY
        SELECT
            CASE
                -- Active subscription with no end date
                WHEN v_subscription.end_date IS NULL AND v_subscription.start_date <= NOW() THEN 'activo'::TEXT
                -- Active subscription with a future end date
                WHEN v_subscription.end_date IS NOT NULL AND NOW() BETWEEN v_subscription.start_date AND v_subscription.end_date THEN 'activo'::TEXT
                -- Grace period (3 days after end_date)
                WHEN v_subscription.end_date IS NOT NULL AND NOW() BETWEEN v_subscription.end_date AND (v_subscription.end_date + '3 days'::interval) THEN 'gracia'::TEXT
                -- Suspended period (up to 3 months after grace period)
                WHEN v_subscription.end_date IS NOT NULL AND NOW() > (v_subscription.end_date + '3 days'::interval) THEN 'suspendido'::TEXT
                -- If none of the above, it's considered cancelled/expired
                ELSE 'cancelado'::TEXT
            END AS calculated_status,
            to_char(v_subscription.end_date, 'YYYY-MM-DD')::text,
            v_subscription.subscription_plan_name::text;
    END IF;
END;
$$;

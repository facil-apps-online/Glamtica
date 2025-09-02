CREATE OR REPLACE FUNCTION public.get_subscription_status_for_tenant(
    p_tenant_id uuid
)
RETURNS TABLE(status text, end_date text, plan_name text)
LANGUAGE plpgsql
AS $$
DECLARE
    v_subscription RECORD;
BEGIN
    -- Find the most recent subscription for the tenant
    SELECT
        ts.end_date,
        ts.status AS subscription_status,
        sp.name AS subscription_plan_name
    INTO
        v_subscription
    FROM
        public.tenant_subscriptions ts
    JOIN
        public.subscription_plans sp ON ts.plan_id = sp.id
    WHERE
        ts.tenant_id = p_tenant_id
    ORDER BY
        ts.created_at DESC
    LIMIT 1;

    -- Determine the final status based on end_date and current status
    IF v_subscription IS NULL THEN
        -- No subscription found, return a default "not subscribed" state
        RETURN QUERY SELECT 'cancelado'::text, NULL::text, NULL::text;
    ELSE
        -- Return the subscription details
        RETURN QUERY SELECT
            v_subscription.subscription_status::text,
            to_char(v_subscription.end_date, 'YYYY-MM-DD')::text,
            v_subscription.subscription_plan_name::text;
    END IF;
END;
$$;

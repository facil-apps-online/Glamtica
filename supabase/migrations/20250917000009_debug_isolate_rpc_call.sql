
-- MIGRATION: DEBUG STEP - Isolate RPC call
-- Turns check_user_availability into a simple wrapper around get_tenant_users

CREATE OR REPLACE FUNCTION public.check_user_availability(
    p_item_id UUID,
    p_item_type TEXT, -- 'service' or 'combo'
    p_branch_id UUID,
    p_tenant_id UUID,
    p_appointment_date DATE,
    p_appointment_time TIME WITHOUT TIME ZONE,
    p_duration_minutes INTEGER,
    p_assigned_user_id UUID DEFAULT NULL
)
RETURNS TABLE(
    user_id UUID,
    commission_rate NUMERIC,
    first_name TEXT,
    last_name TEXT,
    is_active BOOLEAN
)
LANGUAGE plpgsql
-- Let's keep it volatile and without security definer as per the last experiments
VOLATILE
AS $$
BEGIN
    RAISE NOTICE '[check_availability_DEBUG_V4_WRAPPER] Passthrough test. Calling get_tenant_users directly and returning its results transformed.';
    
    RETURN QUERY
    SELECT
        gtu.user_id,
        gtu.default_service_commission_rate AS commission_rate, -- Using a real value as a placeholder
        gtu.first_name,
        gtu.last_name,
        (gtu.status = 'active') AS is_active
    FROM
        public.get_tenant_users(p_tenant_id) gtu;
        -- No WHERE clauses, no other JOINS, just a direct call and return
END;
$$;

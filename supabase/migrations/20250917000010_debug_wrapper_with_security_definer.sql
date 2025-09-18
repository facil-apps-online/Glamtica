
-- MIGRATION: DEBUG STEP - Add SECURITY DEFINER to the wrapper function

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
VOLATILE
SECURITY DEFINER -- Added back for proper testing
AS $$
BEGIN
    RAISE NOTICE '[check_availability_DEBUG_V5_WRAPPER_WITH_DEFINER] Passthrough test. Calling get_tenant_users directly and returning its results transformed.';
    
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

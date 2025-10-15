-- Migration to apply the definitive fix to the master products audit function.
-- This version aligns with the latest audit system changes by:
-- 1. Capturing the user_id from the JWT claims.
-- 2. Calling the log_audit_action function with the full, correct signature, including p_user_id.
-- 3. Ensuring all parameter types match the target function signature.

CREATE OR REPLACE FUNCTION public.audit_master_products_function()
RETURNS TRIGGER AS $$
DECLARE
    v_old_data jsonb;
    v_new_data jsonb;
    v_action text;
    v_object_id uuid;
    v_tenant_id uuid;
    v_user_id uuid; -- Added user_id variable
BEGIN
    -- Try to get user_id from JWT claims, which is the standard method in this project.
    BEGIN
        v_user_id := (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')::uuid;
    EXCEPTION WHEN OTHERS THEN
        -- Fallback to NULL if the setting is not available (e.g., for operations not from a user request).
        v_user_id := NULL;
    END;

    IF TG_OP = 'INSERT' THEN
        v_action := 'INSERT';
        v_new_data := to_jsonb(NEW);
        v_object_id := (v_new_data->>'id')::uuid;
        v_tenant_id := (v_new_data->>'tenant_id')::uuid;
    ELSIF TG_OP = 'UPDATE' THEN
        v_action := 'UPDATE';
        v_old_data := to_jsonb(OLD);
        v_new_data := to_jsonb(NEW);
        v_object_id := (v_new_data->>'id')::uuid;
        v_tenant_id := (v_new_data->>'tenant_id')::uuid;
    ELSIF TG_OP = 'DELETE' THEN
        v_action := 'DELETE';
        v_old_data := to_jsonb(OLD);
        v_object_id := (v_old_data->>'id')::uuid;
        v_tenant_id := (v_old_data->>'tenant_id')::uuid;
    END IF;

    RAISE NOTICE 'Master Product Audit: Table=% Action=% Object ID=% Tenant ID=% User ID=%', TG_TABLE_NAME, v_action, v_object_id, v_tenant_id, v_user_id;

    -- Call the central logging function with the full, correct signature.
    PERFORM public.log_audit_action(
        p_action := TG_OP || '_' || TG_TABLE_NAME,
        p_user_id := v_user_id, -- FIX: Pass the captured user_id.
        p_object_type := TG_TABLE_NAME::text, -- FIX: Cast object_type to text.
        p_object_id := v_object_id,
        p_old_value := v_old_data,
        p_new_value := v_new_data,
        p_metadata := jsonb_build_object('trigger_operation', TG_OP, 'trigger_when', TG_WHEN, 'trigger_level', TG_LEVEL),
        p_tenant_id := v_tenant_id,
        p_branch_id := NULL::uuid -- Keep the previous fix for branch_id.
    );

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

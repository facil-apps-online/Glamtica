
-- Fixes the audit trigger to correctly capture the user_id

-- Step 1: Recreate the log_audit_action function to accept user_id
CREATE OR REPLACE FUNCTION public.log_audit_action(
    p_action text,
    p_user_id uuid, -- Added user_id parameter
    p_object_type text DEFAULT NULL,
    p_object_id uuid DEFAULT NULL,
    p_old_value jsonb DEFAULT NULL,
    p_new_value jsonb DEFAULT NULL,
    p_ip_address inet DEFAULT NULL,
    p_user_agent text DEFAULT NULL,
    p_metadata jsonb DEFAULT NULL,
    p_tenant_id uuid DEFAULT NULL,
    p_branch_id uuid DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    INSERT INTO public.audit_logs (user_id, tenant_id, branch_id, action, object_type, object_id, old_value, new_value, ip_address, user_agent, metadata)
    VALUES (p_user_id, p_tenant_id, p_branch_id, p_action, p_object_type, p_object_id, p_old_value, p_new_value, p_ip_address, p_user_agent, p_metadata);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Recreate the audit_trigger_function to get and pass the user_id
CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    v_old_data jsonb;
    v_new_data jsonb;
    v_action text;
    v_object_id uuid;
    v_tenant_id uuid;
    v_branch_id uuid;
    v_user_id uuid;
BEGIN
    -- Try to get user_id from JWT claims
    BEGIN
        v_user_id := (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')::uuid;
    EXCEPTION WHEN OTHERS THEN
        v_user_id := NULL;
    END;

    IF TG_OP = 'INSERT' THEN
        v_action := 'INSERT';
        v_new_data := to_jsonb(NEW);
        v_object_id := (v_new_data->>'id')::uuid;
        v_tenant_id := (v_new_data->>'tenant_id')::uuid;
        v_branch_id := (v_new_data->>'branch_id')::uuid;

        IF TG_TABLE_NAME = 'tenants' THEN
            v_tenant_id := (v_new_data->>'id')::uuid;
        END IF;

    ELSIF TG_OP = 'UPDATE' THEN
        v_action := 'UPDATE';
        v_old_data := to_jsonb(OLD);
        v_new_data := to_jsonb(NEW);
        v_object_id := (v_new_data->>'id')::uuid;
        v_tenant_id := (v_new_data->>'tenant_id')::uuid;
        v_branch_id := (v_new_data->>'branch_id')::uuid;

        IF TG_TABLE_NAME = 'tenants' THEN
            v_tenant_id := (v_new_data->>'id')::uuid;
        END IF;

    ELSIF TG_OP = 'DELETE' THEN
        v_action := 'DELETE';
        v_old_data := to_jsonb(OLD);
        v_object_id := (v_old_data->>'id')::uuid;
        v_tenant_id := (v_old_data->>'tenant_id')::uuid;
        v_branch_id := (v_old_data->>'branch_id')::uuid;

        IF TG_TABLE_NAME = 'tenants' THEN
            v_tenant_id := (v_old_data->>'id')::uuid;
        END IF;

    END IF;

    -- Call the log_audit_action function with the user_id
    PERFORM public.log_audit_action(
        p_action := TG_OP || '_' || TG_TABLE_NAME,
        p_user_id := v_user_id,
        p_object_type := TG_TABLE_NAME,
        p_object_id := v_object_id,
        p_old_value := v_old_data,
        p_new_value := v_new_data,
        p_metadata := jsonb_build_object('trigger_operation', TG_OP, 'trigger_when', TG_WHEN, 'trigger_level', TG_LEVEL),
        p_tenant_id := v_tenant_id,
        p_branch_id := v_branch_id
    );

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

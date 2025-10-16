-- This migration adds debugging notices to the generic audit_trigger_function.
-- It will help diagnose why the user_id is not being captured for certain tables.

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
    v_jwt_claims jsonb;
BEGIN
    -- For debugging: try to get the JWT claims and log them.
    BEGIN
        v_jwt_claims := current_setting('request.jwt.claims', true)::jsonb;
        RAISE NOTICE '[AUDIT DEBUG] JWT Claims: %', v_jwt_claims;
        v_user_id := (v_jwt_claims ->> 'sub')::uuid;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '[AUDIT DEBUG] Could not get JWT claims. Error: %', SQLERRM;
        v_jwt_claims := NULL;
        v_user_id := NULL;
    END;

    RAISE NOTICE '[AUDIT DEBUG] Captured User ID: %', v_user_id;

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

    -- Call the single, correct log_audit_action function with the captured user_id.
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

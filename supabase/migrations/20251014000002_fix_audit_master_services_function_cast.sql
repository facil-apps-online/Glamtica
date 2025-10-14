-- Migration to fix a bug in the specialized audit function for master services.
-- The previous version passed a typeless NULL for branch_id, causing a function signature mismatch error.
-- This version explicitly casts NULL to the uuid type to match the expected signature of the log_audit_action function.

CREATE OR REPLACE FUNCTION public.audit_master_services_function()
RETURNS TRIGGER AS $$
DECLARE
    v_old_data jsonb;
    v_new_data jsonb;
    v_action text;
    v_object_id uuid;
    v_tenant_id uuid;
BEGIN
    IF TG_OP = 'INSERT' THEN
        v_action := 'INSERT';
        v_new_data := to_jsonb(NEW);
        BEGIN
            v_object_id := NEW.id;
            v_tenant_id := NEW.tenant_id;
        EXCEPTION WHEN OTHERS THEN
            v_object_id := NULL;
            v_tenant_id := NULL;
        END;
    ELSIF TG_OP = 'UPDATE' THEN
        v_action := 'UPDATE';
        v_old_data := to_jsonb(OLD);
        v_new_data := to_jsonb(NEW);
        BEGIN
            v_object_id := NEW.id;
            v_tenant_id := NEW.tenant_id;
        EXCEPTION WHEN OTHERS THEN
            v_object_id := NULL;
            v_tenant_id := NULL;
        END;
    ELSIF TG_OP = 'DELETE' THEN
        v_action := 'DELETE';
        v_old_data := to_jsonb(OLD);
        BEGIN
            v_object_id := OLD.id;
            v_tenant_id := OLD.tenant_id;
        EXCEPTION WHEN OTHERS THEN
            v_object_id := NULL;
            v_tenant_id := NULL;
        END;
    END IF;

    -- This notice is helpful for debugging in the database logs.
    RAISE NOTICE 'Master Service Audit: Table=% Action=% Object ID=% Tenant ID=%', TG_TABLE_NAME, v_action, v_object_id, v_tenant_id;

    -- Call the central logging function, casting NULL to uuid for branch_id
    PERFORM public.log_audit_action(
        p_action := TG_OP || '_' || TG_TABLE_NAME,
        p_object_type := TG_TABLE_NAME,
        p_object_id := v_object_id,
        p_old_value := v_old_data,
        p_new_value := v_new_data,
        p_metadata := jsonb_build_object('trigger_operation', TG_OP, 'trigger_when', TG_WHEN, 'trigger_level', TG_LEVEL),
        p_tenant_id := v_tenant_id,
        p_branch_id := NULL::uuid -- FIX: Explicitly cast NULL to uuid to match the function signature.
    );

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

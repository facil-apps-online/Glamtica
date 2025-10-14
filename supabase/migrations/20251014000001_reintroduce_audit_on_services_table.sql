-- Migration to re-introduce a specific audit trigger for the master `services` table.
-- The original generic trigger was dropped because it expected a `branch_id` column that was removed during a refactor.
-- This new implementation uses a dedicated function that does not expect `branch_id`.

-- 1. Create the specialized audit function for the master services table.
-- This function is a copy of the generic `audit_trigger_function` but is modified
-- to handle the specific structure of the `services` table (it has `tenant_id` but not `branch_id`).
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

    RAISE NOTICE 'Master Service Audit: Table=% Action=% Object ID=% Tenant ID=%', TG_TABLE_NAME, v_action, v_object_id, v_tenant_id;

    -- Call the central logging function, passing NULL for branch_id
    PERFORM public.log_audit_action(
        p_action := TG_OP || '_' || TG_TABLE_NAME,
        p_object_type := TG_TABLE_NAME,
        p_object_id := v_object_id,
        p_old_value := v_old_data,
        p_new_value := v_new_data,
        p_metadata := jsonb_build_object('trigger_operation', TG_OP, 'trigger_when', TG_WHEN, 'trigger_level', TG_LEVEL),
        p_tenant_id := v_tenant_id,
        p_branch_id := NULL -- Explicitly pass NULL for branch_id as it does not exist on the master services table
    );

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Re-create the audit trigger on the 'services' table to use the new specialized function.
-- Drop any old triggers that might exist for safety, including the one that was previously dropped.
DROP TRIGGER IF EXISTS audit_services_master_changes ON public.services;
DROP TRIGGER IF EXISTS audit_services_changes ON public.services;

-- Create the new, correctly-scoped trigger
CREATE TRIGGER audit_services_master_changes
AFTER INSERT OR UPDATE OR DELETE ON public.services
FOR EACH ROW EXECUTE FUNCTION public.audit_master_services_function();

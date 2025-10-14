
-- This migration implements a reliable, platform-agnostic way to capture user_id in the audit log.

-- Step 1: Create a function to set the audit context in a session variable.
CREATE OR REPLACE FUNCTION public.set_audit_context(p_context jsonb)
RETURNS void AS $$
BEGIN
    -- Set a custom session variable to hold the audit context.
    -- Using a generic namespace like 'audit.context' is platform-agnostic.
    PERFORM set_config('audit.context', p_context::text, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Recreate the audit_trigger_function to use the session variable.
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
    v_audit_context jsonb;
BEGIN
    -- Get the audit context from the custom session variable.
    BEGIN
        v_audit_context := current_setting('audit.context', true)::jsonb;
        v_user_id := (v_audit_context ->> 'user_id')::uuid;
        v_tenant_id := (v_audit_context ->> 'tenant_id')::uuid;
        v_branch_id := (v_audit_context ->> 'branch_id')::uuid;
    EXCEPTION WHEN OTHERS THEN
        -- Fallback to NULL if the setting is not available or parsing fails.
        v_user_id := NULL;
        v_tenant_id := NULL;
        v_branch_id := NULL;
    END;

    IF TG_OP = 'INSERT' THEN
        v_action := 'INSERT';
        v_new_data := to_jsonb(NEW);
        v_object_id := (v_new_data->>'id')::uuid;
        -- If tenant_id or branch_id are not in the context, try to get them from the new record.
        v_tenant_id := COALESCE(v_tenant_id, (v_new_data->>'tenant_id')::uuid);
        v_branch_id := COALESCE(v_branch_id, (v_new_data->>'branch_id')::uuid);

        IF TG_TABLE_NAME = 'tenants' THEN
            v_tenant_id := (v_new_data->>'id')::uuid;
        END IF;

    ELSIF TG_OP = 'UPDATE' THEN
        v_action := 'UPDATE';
        v_old_data := to_jsonb(OLD);
        v_new_data := to_jsonb(NEW);
        v_object_id := (v_new_data->>'id')::uuid;
        v_tenant_id := COALESCE(v_tenant_id, (v_new_data->>'tenant_id')::uuid);
        v_branch_id := COALESCE(v_branch_id, (v_new_data->>'branch_id')::uuid);

        IF TG_TABLE_NAME = 'tenants' THEN
            v_tenant_id := (v_new_data->>'id')::uuid;
        END IF;

    ELSIF TG_OP = 'DELETE' THEN
        v_action := 'DELETE';
        v_old_data := to_jsonb(OLD);
        v_object_id := (v_old_data->>'id')::uuid;
        v_tenant_id := COALESCE(v_tenant_id, (v_old_data->>'tenant_id')::uuid);
        v_branch_id := COALESCE(v_branch_id, (v_old_data->>'branch_id')::uuid);

        IF TG_TABLE_NAME = 'tenants' THEN
            v_tenant_id := (v_old_data->>'id')::uuid;
        END IF;

    END IF;

    -- Call the log_audit_action function with the captured context.
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

-- Step 3: Clean up the debug objects.
DROP TRIGGER IF EXISTS debug_audit_trigger ON public.tenants;
DROP TRIGGER IF EXISTS debug_audit_trigger_clients ON public.clients;
DROP FUNCTION IF EXISTS public.debug_audit_context();
DROP TABLE IF EXISTS public.debug_audit;

CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    v_old_data jsonb;
    v_new_data jsonb;
    v_action text;
    v_object_id uuid;
    v_tenant_id uuid;
    v_branch_id uuid;
BEGIN
    IF TG_OP = 'INSERT' THEN
        v_action := 'INSERT';
        v_new_data := to_jsonb(NEW);
        -- Removed BEGIN...EXCEPTION to see direct error if any
        v_object_id := NEW.id;
        -- Special handling for 'tenants' table where 'id' is the tenant_id
        IF TG_TABLE_NAME = 'tenants' THEN
            v_tenant_id := NEW.id;
        ELSE
            v_tenant_id := NEW.tenant_id;
        END IF;
        v_branch_id := NEW.branch_id;
    ELSIF TG_OP = 'UPDATE' THEN
        v_action := 'UPDATE';
        v_old_data := to_jsonb(OLD);
        v_new_data := to_jsonb(NEW);
        -- Removed BEGIN...EXCEPTION to see direct error if any
        v_object_id := NEW.id;
        IF TG_TABLE_NAME = 'tenants' THEN
            v_tenant_id := NEW.id;
        ELSE
            v_tenant_id := NEW.tenant_id;
        END IF;
        v_branch_id := NEW.branch_id;
    ELSIF TG_OP = 'DELETE' THEN
        v_action := 'DELETE';
        v_old_data := to_jsonb(OLD);
        -- Removed BEGIN...EXCEPTION to see direct error if any
        v_object_id := OLD.id;
        IF TG_TABLE_NAME = 'tenants' THEN
            v_tenant_id := OLD.id;
        ELSE
            v_tenant_id := OLD.tenant_id;
        END IF;
        v_branch_id := OLD.branch_id;
    END IF;

    -- DEBUG: Raise an exception to see the values for tenants table
    IF TG_TABLE_NAME = 'tenants' THEN
        RAISE EXCEPTION 'DEBUG: Auditing tenants table. Tenant ID: %, Branch ID: %', v_tenant_id, v_branch_id;
    END IF;

    -- Llama a la función log_audit_action, pasando tenant_id y branch_id
    PERFORM public.log_audit_action(
        p_action := TG_OP || '_' || TG_TABLE_NAME,
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
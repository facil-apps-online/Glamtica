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
        v_object_id := NEW.id;

        IF TG_TABLE_NAME = 'tenants' THEN
            v_tenant_id := NEW.id;
            v_branch_id := NULL; -- Tenants table does not have branch_id
        ELSE
            BEGIN
                v_tenant_id := NEW.tenant_id;
                v_branch_id := NEW.branch_id;
            EXCEPTION WHEN OTHERS THEN
                v_tenant_id := NULL;
                v_branch_id := NULL;
            END;
        END IF;

    ELSIF TG_OP = 'UPDATE' THEN
        v_action := 'UPDATE';
        v_old_data := to_jsonb(OLD);
        v_new_data := to_jsonb(NEW);
        v_object_id := NEW.id;

        IF TG_TABLE_NAME = 'tenants' THEN
            v_tenant_id := NEW.id;
            v_branch_id := NULL;
        ELSE
            BEGIN
                v_tenant_id := NEW.tenant_id;
                v_branch_id := NEW.branch_id;
            EXCEPTION WHEN OTHERS THEN
                v_tenant_id := NULL;
                v_branch_id := NULL;
            END;
        END IF;

    ELSIF TG_OP = 'DELETE' THEN
        v_action := 'DELETE';
        v_old_data := to_jsonb(OLD);
        v_object_id := OLD.id;

        IF TG_TABLE_NAME = 'tenants' THEN
            v_tenant_id := OLD.id;
            v_branch_id := NULL;
        ELSE
            BEGIN
                v_tenant_id := OLD.tenant_id;
                v_branch_id := OLD.branch_id;
            EXCEPTION WHEN OTHERS THEN
                v_tenant_id := NULL;
                v_branch_id := NULL;
            END;
        END IF;
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
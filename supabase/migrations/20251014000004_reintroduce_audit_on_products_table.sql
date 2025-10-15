-- Migration to re-introduce a specific audit trigger for the master `products` table.
-- This follows the same pattern as the services table, as the generic trigger is not suitable
-- for master tables that do not have a `branch_id`.

-- 1. Create the specialized audit function for the master products table.
CREATE OR REPLACE FUNCTION public.audit_master_products_function()
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

    RAISE NOTICE 'Master Product Audit: Table=% Action=% Object ID=% Tenant ID=%', TG_TABLE_NAME, v_action, v_object_id, v_tenant_id;

    -- Call the central logging function, passing NULL for branch_id
    PERFORM public.log_audit_action(
        p_action := TG_OP || '_' || TG_TABLE_NAME,
        p_object_type := TG_TABLE_NAME,
        p_object_id := v_object_id,
        p_old_value := v_old_data,
        p_new_value := v_new_data,
        p_metadata := jsonb_build_object('trigger_operation', TG_OP, 'trigger_when', TG_WHEN, 'trigger_level', TG_LEVEL),
        p_tenant_id := v_tenant_id,
        p_branch_id := NULL -- Explicitly pass NULL for branch_id as it does not exist on the master products table
    );

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Re-create the audit trigger on the 'products' table to use the new specialized function.
-- Drop any old triggers that might exist for safety.
DROP TRIGGER IF EXISTS audit_products_master_changes ON public.products;
DROP TRIGGER IF EXISTS audit_products_changes ON public.products;

-- Create the new, correctly-scoped trigger
CREATE TRIGGER audit_products_master_changes
AFTER INSERT OR UPDATE OR DELETE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.audit_master_products_function();

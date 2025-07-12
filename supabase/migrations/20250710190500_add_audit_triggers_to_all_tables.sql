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
        BEGIN
            v_object_id := NEW.id;
            -- Special handling for 'tenants' table where 'id' is the tenant_id
            IF TG_TABLE_NAME = 'tenants' THEN
                v_tenant_id := NEW.id;
            ELSE
                v_tenant_id := NEW.tenant_id;
            END IF;
            v_branch_id := NEW.branch_id;
        EXCEPTION WHEN OTHERS THEN
            v_object_id := NULL;
            v_tenant_id := NULL;
            v_branch_id := NULL;
        END;
    ELSIF TG_OP = 'UPDATE' THEN
        v_action := 'UPDATE';
        v_old_data := to_jsonb(OLD);
        v_new_data := to_jsonb(NEW);
        BEGIN
            v_object_id := NEW.id;
            IF TG_TABLE_NAME = 'tenants' THEN
                v_tenant_id := NEW.id;
            ELSE
                v_tenant_id := NEW.tenant_id;
            END IF;
            v_branch_id := NEW.branch_id;
        EXCEPTION WHEN OTHERS THEN
            v_object_id := NULL;
            v_tenant_id := NULL;
            v_branch_id := NULL;
        END;
    ELSIF TG_OP = 'DELETE' THEN
        v_action := 'DELETE';
        v_old_data := to_jsonb(OLD);
        BEGIN
            v_object_id := OLD.id;
            IF TG_TABLE_NAME = 'tenants' THEN
                v_tenant_id := OLD.id;
            ELSE
                v_tenant_id := OLD.tenant_id;
            END IF;
            v_branch_id := OLD.branch_id;
        EXCEPTION WHEN OTHERS THEN
            v_object_id := NULL;
            v_tenant_id := NULL;
            v_branch_id := NULL;
        END;
    END IF;

    RAISE NOTICE 'Audit Trigger: Table=% Action=% Object ID=% Tenant ID=% Branch ID=% ', TG_TABLE_NAME, v_action, v_object_id, v_tenant_id, v_branch_id;

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

-- Triggers para tablas principales del sistema
CREATE TRIGGER audit_tenants_changes
AFTER INSERT OR UPDATE OR DELETE ON tenants
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_users_changes
AFTER INSERT OR UPDATE OR DELETE ON users
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_roles_changes
AFTER INSERT OR UPDATE OR DELETE ON roles
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_permissions_changes
AFTER INSERT OR UPDATE OR DELETE ON permissions
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_user_permissions_changes
AFTER INSERT OR UPDATE OR DELETE ON user_permissions
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_menu_permissions_changes
AFTER INSERT OR UPDATE OR DELETE ON menu_permissions
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_branches_changes
AFTER INSERT OR UPDATE OR DELETE ON branches
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_subscription_plans_changes
AFTER INSERT OR UPDATE OR DELETE ON subscription_plans
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_countries_changes
AFTER INSERT OR UPDATE OR DELETE ON countries
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_currencies_changes
AFTER INSERT OR UPDATE OR DELETE ON currencies
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_languages_changes
AFTER INSERT OR UPDATE OR DELETE ON languages
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Triggers para tablas de negocio
CREATE TRIGGER audit_clients_changes
AFTER INSERT OR UPDATE OR DELETE ON clients
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_stylists_changes
AFTER INSERT OR UPDATE OR DELETE ON stylists
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_services_changes
AFTER INSERT OR UPDATE OR DELETE ON services
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_products_changes
AFTER INSERT OR UPDATE OR DELETE ON products
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_attentions_changes
AFTER INSERT OR UPDATE OR DELETE ON attentions
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_purchases_changes
AFTER INSERT OR UPDATE OR DELETE ON purchases
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_translations_changes
AFTER INSERT OR UPDATE OR DELETE ON translations
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_brands_changes
AFTER INSERT OR UPDATE OR DELETE ON brands
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_suppliers_changes
AFTER INSERT OR UPDATE OR DELETE ON suppliers
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_schedule_templates_changes
AFTER INSERT OR UPDATE OR DELETE ON schedule_templates
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_stylist_schedules_changes
AFTER INSERT OR UPDATE OR DELETE ON stylist_schedules
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_stylist_time_off_changes
AFTER INSERT OR UPDATE OR DELETE ON stylist_time_off
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_service_categories_changes
AFTER INSERT OR UPDATE OR DELETE ON service_categories
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_attention_service_products_changes
AFTER INSERT OR UPDATE OR DELETE ON attention_service_products
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_attention_products_changes
AFTER INSERT OR UPDATE OR DELETE ON attention_products
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_service_evidence_changes
AFTER INSERT OR UPDATE OR DELETE ON service_evidence
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_service_sessions_changes
AFTER INSERT OR UPDATE OR DELETE ON service_sessions
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_attention_services_changes
AFTER INSERT OR UPDATE OR DELETE ON attention_services
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_extra_service_sessions_changes
AFTER INSERT OR UPDATE OR DELETE ON extra_service_sessions
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_appointment_evidence_changes
AFTER INSERT OR UPDATE OR DELETE ON appointment_evidence
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_appointment_products_changes
AFTER INSERT OR UPDATE OR DELETE ON appointment_products
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_appointment_extra_services_changes
AFTER INSERT OR UPDATE OR DELETE ON appointment_extra_services
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_appointment_sessions_changes
AFTER INSERT OR UPDATE OR DELETE ON appointment_sessions
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_appointments_changes
AFTER INSERT OR UPDATE OR DELETE ON appointments
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_purchase_items_changes
AFTER INSERT OR UPDATE OR DELETE ON purchase_items
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_product_stylist_commissions_changes
AFTER INSERT OR UPDATE OR DELETE ON product_stylist_commissions
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_supplier_products_changes
AFTER INSERT OR UPDATE OR DELETE ON supplier_products
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_service_stylist_commissions_changes
AFTER INSERT OR UPDATE OR DELETE ON service_stylist_commissions
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Triggers para configuraciones regionales
CREATE TRIGGER audit_tenant_subscriptions_changes
AFTER INSERT OR UPDATE OR DELETE ON tenant_subscriptions
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
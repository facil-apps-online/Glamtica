-- supabase/migrations/20250712183000_create_delete_tenant_cascade_function.sql

-- Creamos una función RPC (Remote Procedure Call) para eliminar un tenant y todos sus datos asociados en cascada.
-- Esto es más seguro y explícito que usar ON DELETE CASCADE en cada tabla.
-- La función solo debe ser llamada por un superadmin.

CREATE OR REPLACE FUNCTION delete_tenant_cascade(target_tenant_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Eliminar datos de tablas dependientes en un orden lógico
    -- para evitar violaciones de foreign keys si las hubiera entre ellas.

    -- Logs y Suscripciones
    DELETE FROM audit_logs WHERE tenant_id = target_tenant_id;
    DELETE FROM tenant_subscriptions WHERE tenant_id = target_tenant_id;

    -- Datos de Atenciones/Citas (Appointments y Attentions)
    DELETE FROM appointment_evidence WHERE tenant_id = target_tenant_id;
    DELETE FROM appointment_extra_services WHERE tenant_id = target_tenant_id;
    DELETE FROM appointment_products WHERE tenant_id = target_tenant_id;
    DELETE FROM appointment_sessions WHERE tenant_id = target_tenant_id;
    DELETE FROM appointments WHERE tenant_id = target_tenant_id;
    DELETE FROM attention_products WHERE tenant_id = target_tenant_id;
    DELETE FROM attention_service_products WHERE tenant_id = target_tenant_id;
    DELETE FROM attention_services WHERE tenant_id = target_tenant_id;
    DELETE FROM attentions WHERE tenant_id = target_tenant_id;
    DELETE FROM extra_service_sessions WHERE tenant_id = target_tenant_id;
    DELETE FROM service_evidence WHERE tenant_id = target_tenant_id;
    DELETE FROM service_sessions WHERE tenant_id = target_tenant_id;

    -- Comisiones
    DELETE FROM product_stylist_commissions WHERE tenant_id = target_tenant_id;
    DELETE FROM service_stylist_commissions WHERE tenant_id = target_tenant_id;

    -- Compras y Proveedores
    DELETE FROM purchase_items WHERE tenant_id = target_tenant_id;
    DELETE FROM purchases WHERE tenant_id = target_tenant_id;
    DELETE FROM supplier_products WHERE tenant_id = target_tenant_id;
    DELETE FROM suppliers WHERE tenant_id = target_tenant_id;

    -- Productos y Servicios
    DELETE FROM products WHERE tenant_id = target_tenant_id;
    DELETE FROM services WHERE tenant_id = target_tenant_id;
    DELETE FROM service_categories WHERE tenant_id = target_tenant_id;
    DELETE FROM brands WHERE tenant_id = target_tenant_id;

    -- Estilistas y Horarios
    DELETE FROM stylist_schedules WHERE tenant_id = target_tenant_id;
    DELETE FROM stylist_time_off WHERE tenant_id = target_tenant_id;
    DELETE FROM schedule_templates WHERE tenant_id = target_tenant_id;
    DELETE FROM stylists WHERE tenant_id = target_tenant_id;

    -- Clientes
    DELETE FROM clients WHERE tenant_id = target_tenant_id;

    -- Sedes
    DELETE FROM tenant_sites WHERE tenant_id = target_tenant_id;

    -- Traducciones y configuraciones de Roles/Permisos
    DELETE FROM translations WHERE tenant_id = target_tenant_id;
    DELETE FROM menu_permissions WHERE tenant_id = target_tenant_id;
    DELETE FROM user_permissions WHERE tenant_id = target_tenant_id;
    DELETE FROM roles WHERE tenant_id = target_tenant_id;

    -- Usuarios (¡CUIDADO!) - Eliminar usuarios asociados a este tenant.
    -- Asumimos que los usuarios no se comparten entre tenants.
    DELETE FROM users WHERE tenant_id = target_tenant_id;

    -- Finalmente, eliminar el tenant de la tabla principal
    DELETE FROM tenants WHERE id = target_tenant_id;

END;
$$;

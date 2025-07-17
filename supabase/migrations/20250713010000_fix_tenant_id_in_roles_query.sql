-- Migración para corregir la función create_tenant_with_admin
-- Se elimina la referencia a la columna inexistente 'tenant_id' en la tabla 'roles'.

CREATE OR REPLACE FUNCTION create_tenant_with_admin(
    -- Parámetros para el tenant
    name TEXT,
    subscription_status TEXT,
    country_id UUID,
    default_language_code TEXT,
    default_currency_id UUID,
    default_timezone TEXT,
    contact_phone TEXT,
    whatsapp_phone TEXT,
    commercial_email TEXT,
    legal_name TEXT,
    tax_id TEXT,
    billing_address TEXT,
    einvoicing_email TEXT,
    physical_address_line1 TEXT,
    physical_address_line2 TEXT,
    physical_city TEXT,
    physical_state TEXT,
    physical_postal_code TEXT,
    website TEXT,
    latitude NUMERIC,
    longitude NUMERIC,
    
    -- Parámetros para el usuario administrador
    admin_email TEXT,
    admin_password TEXT
)
RETURNS TABLE (created_tenant_id UUID)
LANGUAGE plpgsql
AS $$
DECLARE
    new_tenant_id UUID;
    tenant_admin_role_id UUID;
    new_user_id UUID;
BEGIN
    -- 1. Crear el nuevo tenant y obtener su ID
    INSERT INTO tenants (
        name, subscription_status, country_id, default_language_code, default_currency_id, default_timezone,
        contact_phone, whatsapp_phone, commercial_email, legal_name, tax_id, billing_address, einvoicing_email,
        physical_address_line1, physical_address_line2, physical_city, physical_state, physical_postal_code,
        website, latitude, longitude
    ) VALUES (
        create_tenant_with_admin.name, create_tenant_with_admin.subscription_status, create_tenant_with_admin.country_id,
        create_tenant_with_admin.default_language_code, create_tenant_with_admin.default_currency_id, create_tenant_with_admin.default_timezone,
        create_tenant_with_admin.contact_phone, create_tenant_with_admin.whatsapp_phone, create_tenant_with_admin.commercial_email,
        create_tenant_with_admin.legal_name, create_tenant_with_admin.tax_id, create_tenant_with_admin.billing_address,
        create_tenant_with_admin.einvoicing_email, create_tenant_with_admin.physical_address_line1,
        create_tenant_with_admin.physical_address_line2, create_tenant_with_admin.physical_city,
        create_tenant_with_admin.physical_state, create_tenant_with_admin.physical_postal_code,
        create_tenant_with_admin.website, create_tenant_with_admin.latitude, create_tenant_with_admin.longitude
    ) RETURNING id INTO new_tenant_id;

    -- 2. Obtener el ID del rol 'Tenant Superadmin' (CORREGIDO: se eliminó la condición tenant_id IS NULL)
    SELECT id INTO tenant_admin_role_id FROM roles WHERE roles.name = 'Tenant Superadmin' LIMIT 1;
    IF tenant_admin_role_id IS NULL THEN
        RAISE EXCEPTION 'El rol "Tenant Superadmin" no fue encontrado.';
    END IF;

    -- 3. Crear el nuevo usuario administrador
    INSERT INTO users (email, password_hash, tenant_id, role_id)
    VALUES (
        create_tenant_with_admin.admin_email,
        crypt(create_tenant_with_admin.admin_password, gen_salt('bf')),
        new_tenant_id,
        tenant_admin_role_id
    ) RETURNING id INTO new_user_id;

    -- 4. Devolver el ID del tenant creado
    RETURN QUERY SELECT new_tenant_id;

END;
$$;

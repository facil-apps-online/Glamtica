CREATE OR REPLACE FUNCTION create_tenant_and_admin_logic(
    p_business_name TEXT,
    p_country_id UUID,
    p_default_language_code TEXT,
    p_default_currency_id UUID,
    p_default_timezone TEXT,
    p_contact_phone TEXT,
    p_whatsapp_phone TEXT,
    p_commercial_email TEXT,
    p_legal_name TEXT,
    p_tax_id TEXT,
    p_billing_address TEXT,
    p_einvoicing_email TEXT,
    p_physical_address_line1 TEXT,
    p_physical_address_line2 TEXT,
    p_physical_city TEXT,
    p_physical_state TEXT,
    p_physical_postal_code TEXT,
    p_website TEXT,
    p_latitude NUMERIC,
    p_longitude NUMERIC,
    p_admin_email TEXT,
    p_admin_password TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_tenant_id UUID;
    new_user_id UUID;
    new_branch_id UUID;
BEGIN
    -- 1. Crear el Tenant
    INSERT INTO tenants (
        name, country_id, default_language_code, default_currency_id, default_timezone,
        contact_phone, whatsapp_phone, commercial_email, legal_name, tax_id,
        billing_address, einvoicing_email, physical_address_line1, physical_address_line2,
        physical_city, physical_state, physical_postal_code, website, latitude, longitude,
        subscription_status
    ) VALUES (
        p_business_name, p_country_id, p_default_language_code, p_default_currency_id, p_default_timezone,
        p_contact_phone, p_whatsapp_phone, p_commercial_email, p_legal_name, p_tax_id,
        p_billing_address, p_einvoicing_email, p_physical_address_line1, p_physical_address_line2,
        p_physical_city, p_physical_state, p_physical_postal_code, p_website, p_latitude, p_longitude,
        'trial' -- Todos los registros nuevos comienzan en 'trial'
    ) RETURNING id INTO new_tenant_id;

    -- 2. Crear el usuario administrador
    -- Usamos `auth.admin_create_user` que está disponible en el contexto de SECURITY DEFINER
    new_user_id := auth.admin_create_user(
        p_admin_email,
        p_admin_password,
        '{"raw_user_meta_data": {"is_superadmin": false}}'::jsonb
    );

    -- 3. Vincular el usuario al tenant
    INSERT INTO tenant_users (tenant_id, user_id, role)
    VALUES (new_tenant_id, new_user_id, 'admin');

    -- 4. Crear la sucursal principal
    INSERT INTO branches (tenant_id, name, is_main_branch, address_line_1, city, state, postal_code, country_id)
    VALUES (new_tenant_id, 'Sucursal Principal', true, p_physical_address_line1, p_physical_city, p_physical_state, p_physical_postal_code, p_country_id)
    RETURNING id INTO new_branch_id;

    -- 5. Devolver un resultado exitoso
    RETURN json_build_object(
        'success', true,
        'tenant_id', new_tenant_id,
        'user_id', new_user_id,
        'branch_id', new_branch_id
    );
EXCEPTION
    WHEN OTHERS THEN
        -- En caso de cualquier error, devolver un JSON con el mensaje de error
        RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$;

CREATE OR REPLACE FUNCTION public.create_tenant_with_admin(
    name text,
    subscription_status tenant_subscription_status,
    country_id uuid,
    default_language_code text,
    default_currency_id uuid,
    default_timezone text,
    contact_phone text,
    whatsapp_phone text,
    commercial_email text,
    legal_name text,
    tax_id text,
    billing_address text,
    einvoicing_email text,
    physical_address_line1 text,
    physical_address_line2 text,
    physical_city text,
    physical_state text,
    physical_postal_code text,
    website text,
    latitude double precision,
    longitude double precision,
    admin_email text,
    admin_password text
)
RETURNS TABLE(created_tenant_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_tenant_id UUID;
    new_branch_id UUID;
    tenant_admin_role_id UUID;
    new_user_id UUID;
BEGIN
    -- 1. Create the new tenant
    INSERT INTO public.tenants (
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

    -- 2. Create the default "Principal" branch for the new tenant
    INSERT INTO public.branches (tenant_id, name, is_main_branch)
    VALUES (new_tenant_id, 'Principal', TRUE)
    RETURNING id INTO new_branch_id;

    -- 3. Get the 'tenant_super_admin' role ID
    SELECT id INTO tenant_admin_role_id FROM public.roles WHERE roles.name = 'tenant_super_admin' LIMIT 1;
    IF tenant_admin_role_id IS NULL THEN
        RAISE EXCEPTION 'El rol "tenant_super_admin" no fue encontrado.';
    END IF;

    -- 4. Create the new admin user (branch_id is intentionally left NULL)
    INSERT INTO public.users (email, password_hash, tenant_id, role_id)
    VALUES (
        create_tenant_with_admin.admin_email,
        crypt(create_tenant_with_admin.admin_password, gen_salt('bf')),
        new_tenant_id,
        tenant_admin_role_id
    ) RETURNING id INTO new_user_id;

    -- 5. Return the ID of the created tenant
    RETURN QUERY SELECT new_tenant_id;

END;
$$;
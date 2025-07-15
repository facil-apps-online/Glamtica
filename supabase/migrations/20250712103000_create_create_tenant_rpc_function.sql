-- Create the create_tenant RPC function
CREATE OR REPLACE FUNCTION public.create_tenant(
    tenant_name TEXT,
    tenant_contact_person TEXT,
    tenant_contact_email TEXT,
    tenant_contact_phone TEXT,
    tenant_address TEXT,
    tenant_city TEXT,
    tenant_country_id UUID,
    tenant_logo_url TEXT,
    tenant_notes TEXT,
    admin_email TEXT,
    admin_password TEXT,
    admin_language_code TEXT,
    admin_currency_id UUID,
    admin_timezone TEXT
)
RETURNS UUID AS $$
DECLARE
    new_tenant_id UUID;
    tenant_super_admin_role_id UUID;
    new_branch_id UUID;
BEGIN
    -- Get the role_id for 'tenant_super_admin'
    SELECT id INTO tenant_super_admin_role_id FROM public.roles WHERE name = 'tenant_super_admin';

    IF tenant_super_admin_role_id IS NULL THEN
        RAISE EXCEPTION 'Role "tenant_super_admin" not found.';
    END IF;

    -- Insert new tenant
    INSERT INTO public.tenants (
        name,
        contact_person,
        contact_email,
        contact_phone,
        address,
        city,
        country_id,
        logo_url,
        notes,
        default_language_code,
        default_currency_id,
        default_timezone
    )
    VALUES (
        tenant_name,
        tenant_contact_person,
        tenant_contact_email,
        tenant_contact_phone,
        tenant_address,
        tenant_city,
        tenant_country_id,
        tenant_logo_url,
        tenant_notes,
        admin_language_code,
        admin_currency_id,
        admin_timezone
    )
    RETURNING id INTO new_tenant_id;

    -- Create a default branch for the new tenant
    INSERT INTO public.branches (
        tenant_id,
        name,
        address,
        language_code,
        currency_id,
        timezone
    )
    VALUES (
        new_tenant_id,
        'Sede Principal', -- Default branch name
        tenant_address,
        admin_language_code,
        admin_currency_id,
        admin_timezone
    )
    RETURNING id INTO new_branch_id;

    -- Create the tenant_super_admin user
    INSERT INTO public.users (
        email,
        password_hash,
        role_id,
        tenant_id,
        branch_id,
        language_code,
        currency_id,
        timezone,
        is_active
    )
    VALUES (
        admin_email,
        crypt(admin_password, gen_salt('bf')), -- Hash the password
        tenant_super_admin_role_id,
        new_tenant_id,
        new_branch_id,
        admin_language_code,
        admin_currency_id,
        admin_timezone,
        TRUE
    );

    RETURN new_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant usage on the function to authenticated users
GRANT EXECUTE ON FUNCTION public.create_tenant TO authenticated;

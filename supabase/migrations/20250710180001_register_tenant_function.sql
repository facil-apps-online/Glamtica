-- supabase/migrations/YYYYMMDDHHMMSS_register_tenant_function.sql

-- Function to register a new tenant, branch, and admin user
CREATE OR REPLACE FUNCTION register_new_tenant(
    p_business_name TEXT,
    p_admin_email TEXT,
    p_admin_password TEXT
)
RETURNS UUID AS $$
DECLARE
    v_tenant_id UUID;
    v_branch_id UUID;
    v_role_id UUID;
    v_hashed_password TEXT;
BEGIN
    -- Hash the password (replace with a proper hashing mechanism in a real app)
    -- For demonstration, we'll just prepend 'hashed_'
    v_hashed_password := 'hashed_' || p_admin_password;

    -- Insert new tenant
    INSERT INTO public.tenants (name, subscription_status)
    VALUES (p_business_name, 'trial')
    RETURNING id INTO v_tenant_id;

    -- Insert main branch for the new tenant
    INSERT INTO public.branches (tenant_id, name, address)
    VALUES (v_tenant_id, 'Main Branch', 'Default Address')
    RETURNING id INTO v_branch_id;

    -- Get the role_id for 'tenant_super_admin'
    SELECT id INTO v_role_id FROM public.roles WHERE name = 'tenant_super_admin';

    -- Insert the admin user for the new tenant and branch
    INSERT INTO public.users (email, password_hash, role_id, tenant_id, branch_id, is_active)
    VALUES (p_admin_email, v_hashed_password, v_role_id, v_tenant_id, v_branch_id, TRUE);

    RETURN v_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant usage on the function to authenticated users
GRANT EXECUTE ON FUNCTION register_new_tenant(TEXT, TEXT, TEXT) TO authenticated;

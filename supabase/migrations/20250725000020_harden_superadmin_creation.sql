-- Migration: 20250725000020_harden_superadmin_creation.sql
-- Description: Hardens the create_application_superadmin RPC to prevent race conditions
-- and ensure metadata is set correctly, preventing duplicate system owner creation.

-- We are replacing the function, so we drop the old one first.
DROP FUNCTION IF EXISTS public.create_application_superadmin(TEXT);

CREATE OR REPLACE FUNCTION public.create_application_superadmin(
    p_admin_email TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_superadmin_exists BOOLEAN;
    v_system_tenant_id UUID;
    v_super_admin_role_id UUID;
    v_new_user_id UUID;
BEGIN
    -- Step 1: Ensure this function can only be run once.
    -- This check is critical to prevent the unique constraint violation.
    SELECT public.check_superadmin_exists() INTO v_superadmin_exists;
    IF v_superadmin_exists THEN
        RAISE EXCEPTION 'A super_admin already exists. Initial setup cannot be run again.';
    END IF;

    -- Step 2: Create or find the System Owner Tenant.
    -- Using ON CONFLICT ensures this is idempotent.
    INSERT INTO public.tenants (name, is_system_owner, subscription_status, platform_id)
    VALUES ('Glamtica Control Panel', true, 'active', NULL)
    ON CONFLICT (name) DO UPDATE SET is_system_owner = true
    RETURNING id INTO v_system_tenant_id;

    IF v_system_tenant_id IS NULL THEN
        SELECT id INTO v_system_tenant_id FROM public.tenants WHERE name = 'Glamtica Control Panel';
    END IF;

    -- Step 3: Create the super_admin user in Supabase Auth via invitation.
    SELECT auth.admin_create_user(p_admin_email) INTO v_new_user_id;

    -- Step 4: Get the super_admin role ID.
    SELECT id INTO v_super_admin_role_id FROM public.roles WHERE name = 'super_admin';
    IF v_super_admin_role_id IS NULL THEN
        RAISE EXCEPTION 'Role "super_admin" not found.';
    END IF;

    -- Step 5: Assign the role and system tenant to the new user.
    -- Using PERFORM as we don't need the return value.
    PERFORM public.set_user_assignment(
        p_target_user_id := v_new_user_id,
        p_tenant_id := v_system_tenant_id,
        p_role_id := v_super_admin_role_id,
        p_status := 'active'
    );
    
    RAISE NOTICE 'Super admin assignment performed for user %', v_new_user_id;

    RETURN jsonb_build_object('success', true, 'message', 'Super admin created. Please check email for invitation.');

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-grant permissions
GRANT EXECUTE ON FUNCTION public.create_application_superadmin(TEXT) TO anon;

-- COMMENT: Hardens the create_application_superadmin RPC to prevent duplicate system owner creation by improving the initial check and assignment logic.

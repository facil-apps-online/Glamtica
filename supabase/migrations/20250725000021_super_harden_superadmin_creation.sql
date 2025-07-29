-- Migration: 20250725000021_super_harden_superadmin_creation.sql
-- Description: Final hardening of the create_application_superadmin RPC.
-- This version is fully idempotent and includes better debugging notices.

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
    RAISE NOTICE '[superadmin_setup] Starting setup for email: %', p_admin_email;

    -- Step 1: Check if a super_admin already exists.
    SELECT public.check_superadmin_exists() INTO v_superadmin_exists;
    IF v_superadmin_exists THEN
        RAISE NOTICE '[superadmin_setup] Check failed: A super_admin already exists.';
        RAISE EXCEPTION 'A super_admin already exists. Initial setup cannot be run again.';
    END IF;
    RAISE NOTICE '[superadmin_setup] Check passed: No super_admin found.';

    -- Step 2: Create or find the System Owner Tenant.
    RAISE NOTICE '[superadmin_setup] Attempting to create/find system owner tenant...';
    INSERT INTO public.tenants (name, is_system_owner, subscription_status, platform_id)
    VALUES ('Glamtica Control Panel', true, 'active', NULL)
    ON CONFLICT (name) DO UPDATE SET is_system_owner = true
    RETURNING id INTO v_system_tenant_id;

    -- If the tenant already existed from a previous failed run, get its ID.
    IF v_system_tenant_id IS NULL THEN
        SELECT id INTO v_system_tenant_id FROM public.tenants WHERE name = 'Glamtica Control Panel';
        RAISE NOTICE '[superadmin_setup] System owner tenant already existed. Fetched ID: %', v_system_tenant_id;
    ELSE
        RAISE NOTICE '[superadmin_setup] System owner tenant created with ID: %', v_system_tenant_id;
    END IF;

    -- Step 3: Create the user in Supabase Auth.
    RAISE NOTICE '[superadmin_setup] Attempting to create user in auth.users...';
    SELECT auth.admin_create_user(p_admin_email) INTO v_new_user_id;
    IF v_new_user_id IS NULL THEN
        RAISE NOTICE '[superadmin_setup] Failed to create user in auth.users.';
        RAISE EXCEPTION 'Failed to create user in Supabase Auth.';
    END IF;
    RAISE NOTICE '[superadmin_setup] User created in auth.users with ID: %', v_new_user_id;

    -- Step 4: Get the super_admin role ID.
    SELECT id INTO v_super_admin_role_id FROM public.roles WHERE name = 'super_admin';
    IF v_super_admin_role_id IS NULL THEN
        RAISE EXCEPTION 'Role "super_admin" not found.';
    END IF;
    RAISE NOTICE '[superadmin_setup] Found super_admin role ID: %', v_super_admin_role_id;

    -- Step 5: Assign the role and system tenant to the new user.
    RAISE NOTICE '[superadmin_setup] Performing assignment...';
    PERFORM public.set_user_assignment(
        p_target_user_id := v_new_user_id,
        p_tenant_id := v_system_tenant_id,
        p_role_id := v_super_admin_role_id,
        p_status := 'active'
    );
    RAISE NOTICE '[superadmin_setup] Assignment complete.';

    RETURN jsonb_build_object('success', true, 'message', 'Super admin created. Please check email for invitation.');

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '[superadmin_setup] An exception occurred: %', SQLERRM;
        RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.create_application_superadmin(TEXT) TO anon;

-- COMMENT: Final hardening of the create_application_superadmin RPC to make it fully idempotent and add extensive debugging notices.

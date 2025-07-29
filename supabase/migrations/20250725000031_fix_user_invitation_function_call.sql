-- Migration: 20250725000031_fix_user_invitation_function_call.sql
-- Description: This migration corrects the final error in the setup function.
-- It replaces the non-existent `auth.admin_create_user` with the correct
-- `auth.invite_user_by_email` function call.

-- Step 1: Drop the previous version of the function.
DROP FUNCTION IF EXISTS public.create_application_superadmin(TEXT, TEXT);

-- Step 2: Recreate the function with the correct user invitation call.
CREATE OR REPLACE FUNCTION public.create_application_superadmin(
    p_admin_email TEXT,
    p_application_name TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_superadmin_exists BOOLEAN;
    v_platform_id UUID;
    v_system_tenant_id UUID;
    v_super_admin_role RECORD;
    v_new_user_id UUID;
    v_assignments JSONB;
    v_app_metadata JSONB;
BEGIN
    -- Check if a superadmin already exists.
    SELECT public.check_superadmin_exists() INTO v_superadmin_exists;
    IF v_superadmin_exists THEN
        RAISE EXCEPTION 'A super_admin already exists. Initial setup cannot be run again.';
    END IF;

    -- Create the Platform.
    INSERT INTO public.platforms (name, description, base_url)
    VALUES (p_application_name, 'Main application platform', '/')
    ON CONFLICT (name) DO UPDATE 
    SET name = EXCLUDED.name
    RETURNING id INTO v_platform_id;

    -- Create the System Owner Tenant for this platform.
    INSERT INTO public.tenants (name, is_system_owner, subscription_status, platform_id)
    VALUES (p_application_name || ' Control Panel', true, 'active', v_platform_id)
    ON CONFLICT (platform_id) WHERE (is_system_owner = true)
    DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO v_system_tenant_id;

    -- Create the super_admin user in Supabase Auth via invitation.
    -- This is the corrected function call.
    SELECT id INTO v_new_user_id FROM auth.invite_user_by_email(p_admin_email);

    -- Get the super_admin role details.
    SELECT id, name, display_name INTO v_super_admin_role FROM public.roles WHERE name = 'super_admin';
    IF v_super_admin_role.id IS NULL THEN
        RAISE EXCEPTION 'Critical setup error: Role "super_admin" not found in public.roles.';
    END IF;

    -- Construct the full, correct app_metadata object.
    v_assignments := jsonb_build_array(
        jsonb_build_object(
            'assignment_id', gen_random_uuid(),
            'tenant_id', v_system_tenant_id,
            'tenant_name', p_application_name || ' Control Panel',
            'role_id', v_super_admin_role.id,
            'role', v_super_admin_role.name,
            'role_display_name', v_super_admin_role.display_name,
            'branch_id', null,
            'branch_name', null,
            'status', 'active'
        )
    );

    v_app_metadata := jsonb_build_object(
        'assignments', v_assignments,
        'role', v_super_admin_role.name,
        'tenant_id', v_system_tenant_id,
        'branch_id', null,
        'assignment_status', 'active'
    );

    -- Update the user's metadata directly.
    UPDATE auth.users
    SET raw_app_meta_data = v_app_metadata
    WHERE id = v_new_user_id;

    RETURN jsonb_build_object('success', true, 'message', 'Application, tenant, and super admin created. Please check email for invitation.');

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant usage to the anonymous role for the initial setup screen.
GRANT EXECUTE ON FUNCTION public.create_application_superadmin(TEXT, TEXT) TO anon;

-- COMMENT: Corrects the user creation call within the setup RPC.

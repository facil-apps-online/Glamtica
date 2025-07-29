-- Migration: 20250725000019_fix_system_owner_tenant_constraint.sql
-- Description: Adjusts the tenants table to allow the system owner tenant to have a NULL platform_id.

-- Step 1: Make the platform_id column nullable.
-- This is necessary because the system owner tenant does not belong to any single platform.
ALTER TABLE public.tenants
ALTER COLUMN platform_id DROP NOT NULL;

-- Step 2: Correct any existing data that would violate the new constraint.
-- This finds any tenant marked as a system owner and ensures its platform_id is NULL.
UPDATE public.tenants
SET platform_id = NULL
WHERE is_system_owner = true;

-- Step 3: Add a CHECK constraint to enforce data integrity.
-- This ensures that platform_id is only NULL if the tenant is the system owner.
-- For all regular tenants, platform_id remains mandatory.
ALTER TABLE public.tenants
ADD CONSTRAINT platform_id_not_null_for_regular_tenants
CHECK (
    (is_system_owner = true AND platform_id IS NULL) OR
    (is_system_owner = false AND platform_id IS NOT NULL)
);

-- Step 4: Update the create_application_superadmin function to reflect this change.
-- We ensure it inserts a NULL for the platform_id of the system owner tenant.
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
    -- Ensure this function can only be run once.
    SELECT public.check_superadmin_exists() INTO v_superadmin_exists;
    IF v_superadmin_exists THEN
        RAISE EXCEPTION 'A super_admin already exists. Initial setup cannot be run again.';
    END IF;

    -- Create the System Owner Tenant with a NULL platform_id.
    INSERT INTO public.tenants (name, is_system_owner, subscription_status, platform_id)
    VALUES ('Glamtica Control Panel', true, 'active', NULL)
    ON CONFLICT (name) DO UPDATE SET is_system_owner = true
    RETURNING id INTO v_system_tenant_id;

    IF v_system_tenant_id IS NULL THEN
        SELECT id INTO v_system_tenant_id FROM public.tenants WHERE name = 'Glamtica Control Panel';
    END IF;

    -- Create the super_admin user in Supabase Auth via invitation.
    SELECT auth.admin_create_user(p_admin_email) INTO v_new_user_id;

    -- Get the super_admin role ID.
    SELECT id INTO v_super_admin_role_id FROM public.roles WHERE name = 'super_admin';
    IF v_super_admin_role_id IS NULL THEN
        RAISE EXCEPTION 'Role "super_admin" not found.';
    END IF;

    -- Assign the role and system tenant to the new user.
    PERFORM public.set_user_assignment(
        p_target_user_id := v_new_user_id,
        p_tenant_id := v_system_tenant_id,
        p_role_id := v_super_admin_role_id,
        p_status := 'active'
    );

    RETURN jsonb_build_object('success', true, 'message', 'Super admin created. Please check email for invitation.');

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- COMMENT: Fixes a NOT NULL constraint violation by allowing the system owner tenant to have a NULL platform_id, enforcing this rule with a CHECK constraint.
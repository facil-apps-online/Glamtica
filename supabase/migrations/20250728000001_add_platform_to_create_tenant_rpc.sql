-- Migration: 20250728000001_add_platform_to_create_tenant_rpc.sql
-- Description: Updates the 'create_tenant_with_admin' function to include 'p_platform_id'
-- for assigning a tenant to a specific platform upon creation.

-- Step 1: Drop the existing function to update its signature.
DROP FUNCTION IF EXISTS public.create_tenant_with_admin(text, uuid, text, uuid, text, text, text, text, text, text, text, text, text, text, text, text, text, text, double precision, double precision, text);

-- Step 2: Recreate the function with the new 'p_platform_id' parameter.
CREATE OR REPLACE FUNCTION public.create_tenant_with_admin(
    p_name text,
    p_country_id uuid,
    p_default_language_code text,
    p_default_currency_id uuid,
    p_default_timezone text,
    p_contact_phone text,
    p_whatsapp_phone text,
    p_commercial_email text,
    p_legal_name text,
    p_tax_id text,
    p_billing_address text,
    p_einvoicing_email text,
    p_physical_address_line1 text,
    p_physical_address_line2 text,
    p_physical_city text,
    p_physical_state text,
    p_physical_postal_code text,
    p_website text,
    p_latitude double precision,
    p_longitude double precision,
    p_admin_email text,
    p_platform_id uuid -- New parameter
)
RETURNS TABLE(created_tenant_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_caller_role TEXT;
    v_new_tenant_id UUID;
    v_new_branch_id UUID;
    v_tenant_admin_role_id UUID;
    v_new_user_id UUID;
    v_trial_duration_days INT;
BEGIN
    -- Authorization check (allow for both super_admin and server-side calls)
    -- A server-side call (like from register-tenant edge function) might not have a JWT.
    -- We can rely on the SECURITY DEFINER context for server-side calls.
    -- For client-side, we check the role.
    BEGIN
        v_caller_role := (auth.jwt() -> 'app_metadata' ->> 'role');
    EXCEPTION WHEN OTHERS THEN
        v_caller_role := NULL; -- Indicates a potential server-side call
    END;

    IF v_caller_role IS NOT NULL AND v_caller_role != 'super_admin' THEN
        RAISE EXCEPTION 'Permission denied: You must be a super_admin to create a tenant.';
    END IF;

    -- Create the new tenant, now including the platform_id
    INSERT INTO public.tenants (
        name, platform_id, subscription_status, country_id, default_language_code, default_currency_id, default_timezone,
        contact_phone, whatsapp_phone, commercial_email, legal_name, tax_id, billing_address, einvoicing_email,
        physical_address_line1, physical_address_line2, physical_city, physical_state, physical_postal_code,
        website, latitude, longitude
    ) VALUES (
        p_name, p_platform_id, 'trial', p_country_id, p_default_language_code, p_default_currency_id, p_default_timezone,
        p_contact_phone, p_whatsapp_phone, p_commercial_email, p_legal_name, p_tax_id, p_billing_address,
        p_einvoicing_email, p_physical_address_line1, p_physical_address_line2, p_physical_city,
        p_physical_state, p_physical_postal_code, p_website, p_latitude, p_longitude
    ) RETURNING id INTO v_new_tenant_id;

    -- Create the trial subscription
    SELECT gs.trial_duration_days INTO v_trial_duration_days FROM public.global_settings gs LIMIT 1;
    v_trial_duration_days := COALESCE(v_trial_duration_days, 14);
    INSERT INTO public.tenant_subscriptions (tenant_id, is_trial, start_date, end_date, is_active)
    VALUES (v_new_tenant_id, true, now(), now() + (v_trial_duration_days || ' days')::interval, true);

    -- Create the default "Principal" branch
    INSERT INTO public.branches (tenant_id, name, is_main_branch)
    VALUES (v_new_tenant_id, 'Principal', TRUE)
    RETURNING id INTO v_new_branch_id;

    -- Create the new admin user in Supabase Auth via invitation
    SELECT auth.admin_create_user(p_admin_email) INTO v_new_user_id;

    -- Get the 'tenant_super_admin' role ID
    SELECT id INTO v_tenant_admin_role_id FROM public.roles WHERE name = 'tenant_super_admin' LIMIT 1;
    IF v_tenant_admin_role_id IS NULL THEN
        RAISE EXCEPTION 'Role "tenant_super_admin" not found.';
    END IF;

    -- Assign role and tenancy to the new user
    PERFORM public.set_user_assignment(
        p_target_user_id := v_new_user_id,
        p_tenant_id := v_new_tenant_id,
        p_role_id := v_tenant_admin_role_id
    );

    -- Populate default template settings for the new tenant
    INSERT INTO public.tenant_template_settings (tenant_id, template_type, is_active)
    SELECT
        v_new_tenant_id,
        template_type,
        true
    FROM public.email_templates
    WHERE
        propagate_to_new_tenants = true
        AND tenant_id = '00000000-0000-0000-0000-000000000000'
    GROUP BY template_type;

    -- Return the ID of the created tenant
    RETURN QUERY SELECT v_new_tenant_id;
END;
$$;

-- COMMENT: This migration updates the create_tenant_with_admin function to require a platform_id,
-- ensuring every new tenant is associated with a platform from its creation.

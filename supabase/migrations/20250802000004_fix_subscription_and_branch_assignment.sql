-- Migration: 20250802000004_fix_subscription_and_branch_assignment.sql
-- Description: Solves two critical bugs in the tenant creation flow:
-- 1. Adds a mechanism to define a default trial plan and uses it, fixing a NOT NULL violation.
-- 2. Correctly passes the newly created branch_id to the user assignment function.

BEGIN;

-- Step 1: Enhance the subscription_plans table to support default trials.
ALTER TABLE public.subscription_plans
ADD COLUMN IF NOT EXISTS is_default_trial BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.subscription_plans.is_default_trial IS 'If TRUE, this plan is automatically assigned to new tenants of a platform during their trial period.';

-- Create a partial unique index to ensure only one default trial plan per platform.
-- This prevents configuration errors.
CREATE UNIQUE INDEX IF NOT EXISTS one_default_trial_per_platform_idx
ON public.subscription_plans (platform_id)
WHERE (is_default_trial = TRUE);

-- Step 2: Update the tenant setup function to use the new logic.
-- We drop the previous version and create the corrected one.
DROP FUNCTION IF EXISTS public.setup_tenant_for_new_user(UUID, UUID, JSONB);

CREATE OR REPLACE FUNCTION public.setup_tenant_for_new_user(
    p_user_id UUID,
    p_platform_id UUID,
    p_tenant_data JSONB
)
RETURNS UUID -- Returns the ID of the newly created tenant
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_new_tenant_id UUID;
    v_new_branch_id UUID;
    v_tenant_admin_role_id UUID;
    v_trial_duration_days INT;
    v_owner_tenant_id UUID;
    v_role_name TEXT;
    v_default_trial_plan_id UUID;
BEGIN
    -- Data integrity check
    IF p_user_id IS NULL OR p_platform_id IS NULL OR p_tenant_data IS NULL THEN
        RAISE EXCEPTION 'Critical setup error: user_id, platform_id, or tenant_data cannot be NULL.';
    END IF;

    -- Find the default trial subscription plan for the platform.
    SELECT id INTO v_default_trial_plan_id
    FROM public.subscription_plans
    WHERE platform_id = p_platform_id AND is_default_trial = TRUE
    LIMIT 1;

    IF v_default_trial_plan_id IS NULL THEN
        RAISE EXCEPTION 'Configuration error: No default trial plan is defined for platform_id %.', p_platform_id;
    END IF;

    -- Create the new tenant
    INSERT INTO public.tenants (
        platform_id, name, country_id, default_language_code, default_currency_id, default_timezone,
        contact_phone, whatsapp_phone, commercial_email, legal_name, tax_id, billing_address, einvoicing_email,
        physical_address_line1, physical_address_line2, physical_city, physical_state, physical_postal_code,
        website, latitude, longitude, subscription_status
    ) VALUES (
        p_platform_id, p_tenant_data ->> 'name', (p_tenant_data ->> 'country_id')::UUID,
        p_tenant_data ->> 'default_language_code', (p_tenant_data ->> 'default_currency_id')::UUID,
        p_tenant_data ->> 'default_timezone', p_tenant_data ->> 'contact_phone', p_tenant_data ->> 'whatsapp_phone',
        p_tenant_data ->> 'commercial_email', p_tenant_data ->> 'legal_name', p_tenant_data ->> 'tax_id',
        p_tenant_data ->> 'billing_address', p_tenant_data ->> 'einvoicing_email', p_tenant_data ->> 'physical_address_line1',
        p_tenant_data ->> 'physical_address_line2', p_tenant_data ->> 'physical_city', p_tenant_data ->> 'physical_state',
        p_tenant_data ->> 'physical_postal_code', p_tenant_data ->> 'website', (p_tenant_data ->> 'latitude')::double precision,
        (p_tenant_data ->> 'longitude')::double precision, 'trial'
    ) RETURNING id INTO v_new_tenant_id;

    -- Create the trial subscription, now linked to a specific plan
    SELECT trial_duration_days INTO v_trial_duration_days FROM public.subscription_plans WHERE id = v_default_trial_plan_id;
    v_trial_duration_days := COALESCE(v_trial_duration_days, 14);
    INSERT INTO public.tenant_subscriptions (tenant_id, subscription_plan_id, is_trial, start_date, end_date, is_active)
    VALUES (v_new_tenant_id, v_default_trial_plan_id, true, now(), now() + (v_trial_duration_days || ' days')::interval, true);

    -- Create the default "Principal" branch
    INSERT INTO public.branches (tenant_id, name, is_main_branch, address_line_1)
    VALUES (v_new_tenant_id, 'Principal', TRUE, p_tenant_data ->> 'physical_address_line1')
    RETURNING id INTO v_new_branch_id;

    -- Get the role ID for 'tenant_super_admin'
    v_role_name := 'tenant_super_admin';
    SELECT id INTO v_tenant_admin_role_id FROM public.roles WHERE name = v_role_name LIMIT 1;
    IF v_tenant_admin_role_id IS NULL THEN
        RAISE EXCEPTION 'Role "%" not found.', v_role_name;
    END IF;

    -- Assign role and tenancy to the user, now including the default branch ID
    PERFORM public.set_user_assignment(
        p_target_user_id := p_user_id,
        p_tenant_id := v_new_tenant_id,
        p_role_id := v_tenant_admin_role_id,
        p_branch_id := v_new_branch_id -- Correctly passing the branch ID
    );

    -- Find the system owner tenant for the current platform to use as a template source
    SELECT id INTO v_owner_tenant_id
    FROM public.tenants
    WHERE platform_id = p_platform_id AND is_system_owner = true
    LIMIT 1;

    -- Populate default template settings for the new tenant
    IF v_owner_tenant_id IS NOT NULL THEN
        INSERT INTO public.tenant_template_settings (tenant_id, template_type, is_active)
        SELECT v_new_tenant_id, template_type, true
        FROM public.email_templates
        WHERE propagate_to_new_tenants = true AND tenant_id = v_owner_tenant_id
        GROUP BY template_type;
    ELSE
        RAISE WARNING 'No system owner tenant found for platform_id %, cannot propagate email templates.', p_platform_id;
    END IF;

    RETURN v_new_tenant_id;
END;
$$;

COMMENT ON FUNCTION public.setup_tenant_for_new_user(UUID, UUID, JSONB) IS 'v3: Final version. Sets up a tenant, links to a default trial plan, and correctly assigns the main branch to the new admin user.';

COMMIT;

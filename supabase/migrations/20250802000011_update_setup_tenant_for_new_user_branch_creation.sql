BEGIN;

CREATE OR REPLACE FUNCTION public.setup_tenant_for_new_user(p_user_id UUID)
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
    v_platform_id UUID;
    v_role TEXT;
    v_tenant_data JSONB;
    v_owner_tenant_id UUID;
BEGIN
    -- Extract necessary data from the new user's metadata
    SELECT
        (raw_app_meta_data ->> 'platform_id')::UUID,
        (raw_app_meta_data ->> 'role'),
        (raw_app_meta_data -> 'tenant_creation_data')
    INTO
        v_platform_id, v_role, v_tenant_data
    FROM auth.users
    WHERE id = p_user_id;

    -- Security and data integrity check
    IF v_platform_id IS NULL OR v_tenant_data IS NULL THEN
        RAISE EXCEPTION 'Critical setup error for user %: platform_id or tenant_creation_data is missing from metadata.', p_user_id;
    END IF;

    -- Create the new tenant using the data from the metadata
    INSERT INTO public.tenants (
        platform_id, name, country_id, default_language_code, default_currency_id, default_timezone,
        contact_phone, whatsapp_phone, commercial_email, legal_name, tax_id, billing_address, einvoicing_email,
        physical_address_line1, physical_address_line2, physical_city, physical_state, physical_postal_code,
        website, latitude, longitude, subscription_status
    ) VALUES (
        v_platform_id,
        v_tenant_data ->> 'name',
        (v_tenant_data ->> 'country_id')::UUID,
        v_tenant_data ->> 'default_language_code',
        (v_tenant_data ->> 'default_currency_id')::UUID,
        v_tenant_data ->> 'default_timezone',
        v_tenant_data ->> 'contact_phone',
        v_tenant_data ->> 'whatsapp_phone',
        v_tenant_data ->> 'commercial_email',
        v_tenant_data ->> 'legal_name',
        v_tenant_data ->> 'tax_id',
        v_tenant_data ->> 'billing_address',
        v_tenant_data ->> 'einvoicing_email',
        v_tenant_data ->> 'physical_address_line1',
        v_tenant_data ->> 'physical_address_line2',
        v_tenant_data ->> 'physical_city',
        v_tenant_data ->> 'physical_state',
        v_tenant_data ->> 'physical_postal_code',
        v_tenant_data ->> 'website',
        (v_tenant_data ->> 'latitude')::double precision,
        (v_tenant_data ->> 'longitude')::double precision,
        'trial'
    ) RETURNING id INTO v_new_tenant_id;

    -- Create the trial subscription
    SELECT gs.trial_duration_days INTO v_trial_duration_days FROM public.global_settings gs LIMIT 1;
    v_trial_duration_days := COALESCE(v_trial_duration_days, 14);
    INSERT INTO public.tenant_subscriptions (tenant_id, is_trial, start_date, end_date, is_active)
    VALUES (v_new_tenant_id, true, now(), now() + (v_trial_duration_days || ' days')::interval, true);

    -- Create the default "Principal" branch with all detailed fields
    INSERT INTO public.branches (
        tenant_id,
        name,
        is_main_branch,
        address, -- General address
        contact_phone,
        whatsapp_phone,
        commercial_email,
        website,
        physical_address_line1,
        physical_address_line2,
        physical_city,
        physical_state,
        physical_postal_code,
        latitude,
        longitude
    )
    VALUES (
        v_new_tenant_id,
        'Principal',
        TRUE,
        v_tenant_data ->> 'physical_address_line1', -- Using physical_address_line1 as general address
        v_tenant_data ->> 'contact_phone',
        v_tenant_data ->> 'whatsapp_phone',
        v_tenant_data ->> 'commercial_email',
        v_tenant_data ->> 'website',
        v_tenant_data ->> 'physical_address_line1',
        v_tenant_data ->> 'physical_address_line2',
        v_tenant_data ->> 'physical_city',
        v_tenant_data ->> 'physical_state',
        v_tenant_data ->> 'physical_postal_code',
        (v_tenant_data ->> 'latitude')::NUMERIC(10, 8),
        (v_tenant_data ->> 'longitude')::NUMERIC(11, 8)
    )
    RETURNING id INTO v_new_branch_id;

    -- Get the role ID from the metadata (e.g., 'tenant_super_admin')
    SELECT id INTO v_tenant_admin_role_id FROM public.roles WHERE name = v_role LIMIT 1;
    IF v_tenant_admin_role_id IS NULL THEN
        RAISE EXCEPTION 'Role "%" not found.', v_role;
    END IF;

    -- Assign role and tenancy to the user
    PERFORM public.set_user_assignment(
        p_target_user_id := p_user_id,
        p_tenant_id := v_new_tenant_id,
        p_role_id := v_tenant_admin_role_id
    );

    -- Find the system owner tenant for the current platform to use as a template source
    SELECT id INTO v_owner_tenant_id
    FROM public.tenants
    WHERE platform_id = v_platform_id AND is_system_owner = true
    LIMIT 1;

    -- Populate default template settings for the new tenant
    IF v_owner_tenant_id IS NOT NULL THEN
        INSERT INTO public.tenant_template_settings (tenant_id, template_type, is_active)
        SELECT v_new_tenant_id, template_type, true
        FROM public.email_templates
        WHERE propagate_to_new_tenants = true AND tenant_id = v_owner_tenant_id
        GROUP BY template_type;
    ELSE
        RAISE WARNING 'No system owner tenant found for platform_id %, cannot propagate email templates.', v_platform_id;
    END IF;

    RETURN v_new_tenant_id;
END;
$$;

COMMENT ON FUNCTION public.setup_tenant_for_new_user(UUID) IS 'v2: Canonical function to set up a complete tenant environment for a newly created user. Reads metadata from auth.users to perform setup, now including detailed branch creation.';

COMMIT;
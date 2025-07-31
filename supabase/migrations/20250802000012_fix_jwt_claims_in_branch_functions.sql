CREATE OR REPLACE FUNCTION public.create_branch(
    p_name TEXT,
    p_address TEXT DEFAULT NULL,
    p_contact_phone TEXT DEFAULT NULL,
    p_whatsapp_phone TEXT DEFAULT NULL,
    p_commercial_email TEXT DEFAULT NULL,
    p_website TEXT DEFAULT NULL,
    p_physical_address_line1 TEXT DEFAULT NULL,
    p_physical_address_line2 TEXT DEFAULT NULL,
    p_physical_city TEXT DEFAULT NULL,
    p_physical_state TEXT DEFAULT NULL,
    p_physical_postal_code TEXT DEFAULT NULL,
    p_latitude NUMERIC(10, 8) DEFAULT NULL,
    p_longitude NUMERIC(11, 8) DEFAULT NULL
)
RETURNS public.branches
LANGUAGE plpgsql
SECURITY DEFINER
AS $function_body$
DECLARE
    v_tenant_id UUID;
    new_branch public.branches;
BEGIN
    -- Corrected way to extract tenant_id from JWT
    SELECT (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid INTO v_tenant_id;
    IF v_tenant_id IS NULL THEN
        RAISE EXCEPTION 'Tenant ID not found in JWT claims';
    END IF;

    INSERT INTO public.branches (
        tenant_id,
        name,
        address,
        is_main_branch,
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
        v_tenant_id,
        p_name,
        p_address,
        false,
        p_contact_phone,
        p_whatsapp_phone,
        p_commercial_email,
        p_website,
        p_physical_address_line1,
        p_physical_address_line2,
        p_physical_city,
        p_physical_state,
        p_physical_postal_code,
        p_latitude,
        p_longitude
    )
    RETURNING * INTO new_branch;

    RETURN new_branch;
END;
$function_body$;

COMMENT ON FUNCTION public.create_branch(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC, NUMERIC) IS 'Creates a new non-main branch for the authenticated user''s tenant with detailed information.';

CREATE OR REPLACE FUNCTION public.update_branch(
    p_branch_id UUID,
    p_name TEXT,
    p_address TEXT DEFAULT NULL,
    p_contact_phone TEXT DEFAULT NULL,
    p_whatsapp_phone TEXT DEFAULT NULL,
    p_commercial_email TEXT DEFAULT NULL,
    p_website TEXT DEFAULT NULL,
    p_physical_address_line1 TEXT DEFAULT NULL,
    p_physical_address_line2 TEXT DEFAULT NULL,
    p_physical_city TEXT DEFAULT NULL,
    p_physical_state TEXT DEFAULT NULL,
    p_physical_postal_code TEXT DEFAULT NULL,
    p_latitude NUMERIC(10, 8) DEFAULT NULL,
    p_longitude NUMERIC(11, 8) DEFAULT NULL
)
RETURNS public.branches
LANGUAGE plpgsql
SECURITY DEFINER
AS $function_body$
DECLARE
    v_tenant_id UUID;
    updated_branch public.branches;
BEGIN
    -- Corrected way to extract tenant_id from JWT
    v_tenant_id := (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid;
    IF v_tenant_id IS NULL THEN RAISE EXCEPTION 'Tenant ID not found in JWT claims'; END IF;

    UPDATE public.branches
    SET
        name = p_name,
        address = p_address,
        contact_phone = p_contact_phone,
        whatsapp_phone = p_whatsapp_phone,
        commercial_email = p_commercial_email,
        website = p_website,
        physical_address_line1 = p_physical_address_line1,
        physical_address_line2 = p_physical_address_line2,
        physical_city = p_physical_city,
        physical_state = p_physical_state,
        physical_postal_code = p_physical_postal_code,
        latitude = p_latitude,
        longitude = p_longitude,
        updated_at = NOW()
    WHERE
        id = p_branch_id AND tenant_id = v_tenant_id
    RETURNING * INTO updated_branch;

    IF updated_branch IS NULL THEN RAISE EXCEPTION 'Branch not found or access denied'; END IF;
    RETURN updated_branch;
END;
$function_body$;

COMMENT ON FUNCTION public.update_branch(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC, NUMERIC) IS 'Updates an existing branch for the authenticated user''s tenant with detailed information.';
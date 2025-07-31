DROP FUNCTION IF EXISTS public.update_branch(
    UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC, NUMERIC
);

CREATE OR REPLACE FUNCTION public.update_branch(
    p_branch_id UUID,
    p_name TEXT,
    p_address TEXT,
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
    v_tenant_id := (auth.jwt() ->> 'tenant_id')::uuid;
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
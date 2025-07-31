DROP FUNCTION IF EXISTS public.create_branch(
    TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC, NUMERIC
);

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
DECLARE
    v_tenant_id UUID;
    new_branch public.branches;
BEGIN
    SELECT jwt.claims->>'tenant_id' INTO v_tenant_id FROM auth.jwt() jwt;
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
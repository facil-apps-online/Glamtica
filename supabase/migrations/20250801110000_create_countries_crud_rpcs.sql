-- 1. Get Countries List (with search and joins)
-- This function follows the "Data Access Standard for Lists"
CREATE OR REPLACE FUNCTION get_countries_list(p_search_term TEXT DEFAULT NULL)
RETURNS TABLE (
    id uuid,
    name text,
    iso_code text,
    is_active boolean,
    created_at timestamp with time zone,
    currency_id uuid,
    currency_name text,
    default_language_id uuid,
    language_name text,
    timezone text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        co.id,
        co.name,
        co.iso_code,
        co.is_active,
        co.created_at,
        co.currency_id,
        cu.name as currency_name,
        co.default_language_id,
        l.name as language_name,
        co.timezone
    FROM public.countries co
    LEFT JOIN public.currencies cu ON co.currency_id = cu.id
    LEFT JOIN public.languages l ON co.default_language_id = l.id
    WHERE (p_search_term IS NULL OR co.name ILIKE '%' || p_search_term || '%' OR co.iso_code ILIKE '%' || p_search_term || '%')
    ORDER BY co.name ASC;
END;
$$;

COMMENT ON FUNCTION get_countries_list(TEXT) IS 'Fetches a list of countries for the superadmin, with optional search and joins for currency/language names.';

-- 2. Create Country
CREATE OR REPLACE FUNCTION create_country(p_payload JSONB)
RETURNS SETOF public.countries
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    INSERT INTO public.countries (name, iso_code, currency_id, default_language_id, timezone, is_active)
    SELECT
        p_payload->>'name',
        p_payload->>'iso_code',
        (p_payload->>'currency_id')::uuid,
        (p_payload->>'default_language_id')::uuid,
        p_payload->>'timezone',
        (p_payload->>'is_active')::boolean
    RETURNING *;
END;
$$;

COMMENT ON FUNCTION create_country(JSONB) IS 'Creates a new country from a JSON payload.';

-- 3. Update Country
CREATE OR REPLACE FUNCTION update_country(p_id UUID, p_payload JSONB)
RETURNS SETOF public.countries
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    UPDATE public.countries
    SET
        name = COALESCE(p_payload->>'name', name),
        iso_code = COALESCE(p_payload->>'iso_code', iso_code),
        currency_id = COALESCE((p_payload->>'currency_id')::uuid, currency_id),
        default_language_id = COALESCE((p_payload->>'default_language_id')::uuid, default_language_id),
        timezone = COALESCE(p_payload->>'timezone', timezone),
        is_active = COALESCE((p_payload->>'is_active')::boolean, is_active),
        updated_at = now()
    WHERE id = p_id
    RETURNING *;
END;
$$;

COMMENT ON FUNCTION update_country(UUID, JSONB) IS 'Updates an existing country based on its ID and a JSON payload.';

-- 4. Delete Country
CREATE OR REPLACE FUNCTION delete_country(p_id UUID)
RETURNS TABLE(deleted_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    DELETE FROM public.countries
    WHERE id = p_id
    RETURNING public.countries.id;
END;
$$;

COMMENT ON FUNCTION delete_country(UUID) IS 'Deletes a country by its ID.';
-- 1. Get Languages List (with search)
-- This function follows the "Data Access Standard for Lists"
CREATE OR REPLACE FUNCTION get_languages_list(p_search_term TEXT DEFAULT NULL)
RETURNS TABLE (
    id uuid,
    name text,
    iso_code text,
    is_active boolean,
    created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        l.id,
        l.name,
        l.iso_code,
        l.is_active,
        l.created_at
    FROM public.languages l
    WHERE (p_search_term IS NULL OR l.name ILIKE '%' || p_search_term || '%' OR l.iso_code ILIKE '%' || p_search_term || '%')
    ORDER BY l.name ASC;
END;
$$;

COMMENT ON FUNCTION get_languages_list(TEXT) IS 'Fetches a list of languages (localizations) for the superadmin, with optional search by name or iso_code.';

-- 2. Create Language
CREATE OR REPLACE FUNCTION create_language(p_payload JSONB)
RETURNS SETOF public.languages
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    INSERT INTO public.languages (name, iso_code, is_active)
    SELECT
        p_payload->>'name',
        p_payload->>'iso_code',
        (p_payload->>'is_active')::boolean
    RETURNING *;
END;
$$;

COMMENT ON FUNCTION create_language(JSONB) IS 'Creates a new language (localization) from a JSON payload.';

-- 3. Update Language
CREATE OR REPLACE FUNCTION update_language(p_id UUID, p_payload JSONB)
RETURNS SETOF public.languages
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    UPDATE public.languages
    SET
        name = COALESCE(p_payload->>'name', name),
        iso_code = COALESCE(p_payload->>'iso_code', iso_code),
        is_active = COALESCE((p_payload->>'is_active')::boolean, is_active),
        updated_at = now()
    WHERE id = p_id
    RETURNING *;
END;
$$;

COMMENT ON FUNCTION update_language(UUID, JSONB) IS 'Updates an existing language (localization) based on its ID and a JSON payload.';

-- 4. Delete Language
CREATE OR REPLACE FUNCTION delete_language(p_id UUID)
RETURNS TABLE(deleted_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    DELETE FROM public.languages
    WHERE id = p_id
    RETURNING public.languages.id;
END;
$$;

COMMENT ON FUNCTION delete_language(UUID) IS 'Deletes a language (localization) by its ID.';
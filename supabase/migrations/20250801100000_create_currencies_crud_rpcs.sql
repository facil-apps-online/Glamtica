-- 1. Get Currencies List (with search)
-- This function follows the "Data Access Standard for Lists"
CREATE OR REPLACE FUNCTION get_currencies_list(p_search_term TEXT DEFAULT NULL)
RETURNS TABLE (
    id uuid,
    name text,
    code text,
    symbol text,
    format text,
    is_active boolean,
    created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id,
        c.name,
        c.code,
        c.symbol,
        c.format,
        c.is_active,
        c.created_at
    FROM public.currencies c
    WHERE (p_search_term IS NULL OR c.name ILIKE '%' || p_search_term || '%' OR c.code ILIKE '%' || p_search_term || '%')
    ORDER BY c.name ASC;
END;
$$;

COMMENT ON FUNCTION get_currencies_list(TEXT) IS 'Fetches a list of currencies for the superadmin, with optional search by name or code.';

-- 2. Create Currency
CREATE OR REPLACE FUNCTION create_currency(p_payload JSONB)
RETURNS SETOF public.currencies
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    INSERT INTO public.currencies (name, code, symbol, format, is_active)
    SELECT
        p_payload->>'name',
        p_payload->>'code',
        p_payload->>'symbol',
        p_payload->>'format',
        (p_payload->>'is_active')::boolean
    RETURNING *;
END;
$$;

COMMENT ON FUNCTION create_currency(JSONB) IS 'Creates a new currency from a JSON payload.';

-- 3. Update Currency
CREATE OR REPLACE FUNCTION update_currency(p_id UUID, p_payload JSONB)
RETURNS SETOF public.currencies
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    UPDATE public.currencies
    SET
        name = COALESCE(p_payload->>'name', name),
        code = COALESCE(p_payload->>'code', code),
        symbol = COALESCE(p_payload->>'symbol', symbol),
        format = COALESCE(p_payload->>'format', format),
        is_active = COALESCE((p_payload->>'is_active')::boolean, is_active),
        updated_at = now()
    WHERE id = p_id
    RETURNING *;
END;
$$;

COMMENT ON FUNCTION update_currency(UUID, JSONB) IS 'Updates an existing currency based on its ID and a JSON payload with the new data.';

-- 4. Delete Currency
CREATE OR REPLACE FUNCTION delete_currency(p_id UUID)
RETURNS TABLE(deleted_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    DELETE FROM public.currencies
    WHERE id = p_id
    RETURNING public.currencies.id;
END;
$$;

COMMENT ON FUNCTION delete_currency(UUID) IS 'Deletes a currency by its ID and returns the ID of the deleted record.';
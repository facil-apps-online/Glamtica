-- Migration: Create get_platforms_list RPC
-- Description: Creates an RPC function to efficiently fetch the list of platforms for the superadmin interface, with search capabilities.

CREATE OR REPLACE FUNCTION get_platforms_list(p_search_term TEXT DEFAULT NULL)
RETURNS TABLE (
    id uuid,
    name text,
    description text,
    base_url text
)
LANGUAGE plpgsql
AS $
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.name,
        p.description,
        p.base_url
    FROM
        public.platforms p
    WHERE
        (p_search_term IS NULL OR p.name ILIKE '%' || p_search_term || '%')
    ORDER BY
        p.created_at DESC;
END;
$;


-- This migration fixes the search_clients function to use OR for multiple search terms.

CREATE OR REPLACE FUNCTION search_clients(
    p_tenant_id UUID,
    p_branch_id TEXT,
    p_search_term TEXT,
    p_show_inactive BOOLEAN
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    email TEXT,
    phone TEXT,
    document_number TEXT,
    is_active BOOLEAN,
    parent_client_id UUID,
    tenant_id UUID,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    parent_client_name TEXT,
    branches JSONB
) AS $$
DECLARE
    search_words TEXT[];
    search_query TEXT;
    final_query TEXT;
    branch_uuid UUID;
BEGIN
    -- Handle 'all' branches case
    IF p_branch_id = 'all' THEN
        branch_uuid := NULL;
    ELSE
        branch_uuid := p_branch_id::UUID;
    END IF;

    -- Build the full-text search query
    IF p_search_term IS NOT NULL AND p_search_term <> '' THEN
        search_words := string_to_array(lower(p_search_term), ' ');
        search_query := array_to_string(search_words, ' | '); -- Changed & to |
    ELSE
        search_query := NULL;
    END IF;

    -- Construct the final query
    final_query := '
        WITH client_branches_agg AS (
            SELECT 
                cb.client_id, 
                jsonb_agg(jsonb_build_object(''id'', b.id, ''name'', b.name)) as branches
            FROM client_branches cb
            JOIN branches b ON cb.branch_id = b.id
            WHERE cb.tenant_id = $1
            GROUP BY cb.client_id
        )
        SELECT
            c.id,
            c.name,
            c.email,
            c.phone,
            c.document_number,
            c.is_active,
            c.parent_client_id,
            c.tenant_id,
            c.created_at,
            c.updated_at,
            pc.name as parent_client_name,
            cba.branches
        FROM
            clients c
        LEFT JOIN
            clients pc ON c.parent_client_id = pc.id
        LEFT JOIN 
            client_branches_agg cba ON c.id = cba.client_id
        WHERE
            c.tenant_id = $1';

    IF branch_uuid IS NOT NULL THEN
        final_query := final_query || '
            AND c.id IN (SELECT client_id FROM client_branches WHERE branch_id = $2 AND tenant_id = $1)';
    END IF;

    IF NOT p_show_inactive THEN
        final_query := final_query || '
            AND c.is_active = TRUE';
    END IF;

    IF search_query IS NOT NULL THEN
        final_query := final_query || format(' AND c.fts @@ to_tsquery(''simple'', %L)', search_query);
    END IF;

    final_query := final_query || '
        ORDER BY c.name;';

    -- Execute the query
    IF branch_uuid IS NOT NULL THEN
         RETURN QUERY EXECUTE final_query USING p_tenant_id, branch_uuid;
    ELSE
         RETURN QUERY EXECUTE final_query USING p_tenant_id;
    END IF;

END;
$$ LANGUAGE plpgsql;

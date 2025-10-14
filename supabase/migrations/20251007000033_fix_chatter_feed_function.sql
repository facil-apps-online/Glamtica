-- Repara la función get_unified_chatter_feed para que no acceda directamente a auth.users
-- En su lugar, utiliza la función existente get_tenant_users para obtener los detalles del usuario de forma segura.

CREATE OR REPLACE FUNCTION public.get_unified_chatter_feed(
    p_resource_type TEXT,
    p_resource_id UUID
)
RETURNS TABLE (
    id UUID,
    event_source TEXT, -- 'comment' or 'audit'
    created_at TIMESTAMPTZ,
    user_id UUID,
    user_full_name TEXT,
    user_avatar_url TEXT,
    payload JSONB
) AS $$
DECLARE
    v_tenant_id UUID;
BEGIN
    -- Determinar el tenant_id a partir del recurso solicitado.
    SELECT tenant_id INTO v_tenant_id
    FROM public.chatter_comments
    WHERE resource_id = p_resource_id
    LIMIT 1;

    IF v_tenant_id IS NULL THEN
        SELECT tenant_id INTO v_tenant_id
        FROM public.audit_logs
        WHERE object_id = p_resource_id
        LIMIT 1;
    END IF;

    IF v_tenant_id IS NULL THEN
        RETURN;
    END IF;

    RETURN QUERY
    WITH user_details AS (
        -- Llama a la función existente y definitiva para obtener los usuarios del tenant de forma segura.
        SELECT 
            tu.user_id as id, 
            -- Concatena nombre y apellido, manejando posibles nulos.
            TRIM(CONCAT(tu.first_name, ' ', tu.last_name)) as full_name,
            tu.avatar_url
        FROM public.get_tenant_users(v_tenant_id) tu
    )
    SELECT
        c.id,
        'comment' as event_source,
        c.created_at,
        c.user_id,
        u.full_name,
        u.avatar_url,
        jsonb_build_object('text', c.comment_text) as payload
    FROM public.chatter_comments c
    LEFT JOIN user_details u ON c.user_id = u.id
    WHERE c.resource_type = p_resource_type AND c.resource_id = p_resource_id

    UNION ALL

    SELECT
        a.id,
        'audit' as event_source,
        a.created_at,
        a.user_id,
        u.full_name,
        u.avatar_url,
        jsonb_build_object(
            'action', a.action,
            'old_value', a.old_value,
            'new_value', a.new_value
        ) as payload
    FROM public.audit_logs a
    LEFT JOIN user_details u ON a.user_id = u.id
    WHERE a.object_type = p_resource_type AND a.object_id = p_resource_id

    ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.get_unified_chatter_feed IS 'Returns a combined, chronological feed of manual comments and automatic audit logs for a specific resource.';

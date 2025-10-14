-- Creates a unified feed for the chatter, combining manual comments and automatic audit logs.

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
BEGIN
    RETURN QUERY
    WITH user_details AS (
        -- CTE to get user details to avoid multiple joins
        SELECT u.id, u.raw_user_meta_data->>'full_name' as full_name, u.raw_user_meta_data->>'avatar_url' as avatar_url
        FROM auth.users u
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

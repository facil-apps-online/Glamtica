-- MIGRACIÓN COMBINADA: Corrige permisos y añade diagnóstico al chatter.
-- PARTE 1: Corrige RLS de audit_logs para que los miembros del tenant puedan ver los registros.
-- PARTE 2: Añade una columna 'canario' (debug_version) a la función get_unified_chatter_feed para verificar la versión en ejecución.

-- PARTE 1: Política de RLS para audit_logs
CREATE POLICY "Allow tenant members to view their tenant's audit logs"
ON public.audit_logs FOR SELECT
USING (
  (auth.jwt() -> 'app_metadata' -> 'assignments' -> 0 ->> 'tenant_id')::uuid = tenant_id
);


-- PARTE 2: Función de diagnóstico para get_unified_chatter_feed
DROP FUNCTION IF EXISTS public.get_unified_chatter_feed(TEXT, UUID);

CREATE OR REPLACE FUNCTION public.get_unified_chatter_feed(
    p_resource_type TEXT,
    p_resource_id UUID
)
RETURNS TABLE (
    id UUID,
    event_type TEXT,
    created_at TIMESTAMPTZ,
    user_id UUID,
    user_full_name TEXT,
    user_avatar_url TEXT,
    payload JSONB,
    debug_version TEXT -- Columna canario para depuración
) AS $$
DECLARE
    v_tenant_id UUID;
BEGIN
    -- Determinar el tenant_id a partir del recurso solicitado.
    SELECT tenant_id INTO v_tenant_id FROM public.chatter_comments WHERE resource_id = p_resource_id LIMIT 1;
    IF v_tenant_id IS NULL THEN
        SELECT tenant_id INTO v_tenant_id FROM public.audit_logs WHERE object_id = p_resource_id LIMIT 1;
    END IF;
    IF v_tenant_id IS NULL THEN RETURN; END IF;

    RETURN QUERY
    WITH user_details AS (
        SELECT DISTINCT ON (tu.user_id)
            tu.user_id as id,
            COALESCE(NULLIF(TRIM(CONCAT(tu.first_name, ' ', tu.last_name)), ''), tu.email) as full_name,
            tu.avatar_url
        FROM public.get_tenant_users(v_tenant_id) tu
    )
    SELECT
        c.id,
        'comment' as event_type,
        c.created_at,
        c.user_id,
        COALESCE('JOIN_SUCCESS:' || u.full_name, 'JOIN_FAILED:' || c.user_id::text) as user_full_name,
        u.avatar_url,
        jsonb_build_object('text', c.comment_text) as payload,
        'v37'::TEXT as debug_version
    FROM public.chatter_comments c
    LEFT JOIN user_details u ON c.user_id = u.id
    WHERE c.resource_type = p_resource_type AND c.resource_id = p_resource_id

    UNION ALL

    SELECT
        a.id,
        CASE
            WHEN a.action = 'INSERT' THEN 'creation'
            WHEN a.action = 'UPDATE' THEN 'field_update'
            ELSE a.action
        END as event_type,
        a.created_at,
        a.user_id,
        COALESCE('JOIN_SUCCESS:' || u.full_name, 'JOIN_FAILED:' || a.user_id::text) as user_full_name,
        u.avatar_url,
        jsonb_build_object(
            'old_record', a.old_value,
            'new_record', a.new_value
        ) as payload,
        'v37'::TEXT as debug_version
    FROM public.audit_logs a
    LEFT JOIN user_details u ON a.user_id = u.id
    WHERE a.object_type = p_resource_type AND a.object_id = p_resource_id

    ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.get_unified_chatter_feed IS 'Returns a combined feed. (DEBUGGING VERSION v37)';

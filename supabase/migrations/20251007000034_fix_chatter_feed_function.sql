-- Repara la función get_unified_chatter_feed para solucionar duplicados y problemas de formato de eventos.
-- Se elimina la función anterior explícitamente para permitir el cambio en el tipo de retorno (event_source -> event_type).

DROP FUNCTION IF EXISTS public.get_unified_chatter_feed(TEXT, UUID);

-- 1. Usa DISTINCT ON para evitar usuarios duplicados por múltiples asignaciones.
-- 2. Mapea correctamente los tipos de eventos de auditoría (INSERT -> creation, UPDATE -> field_update).
-- 3. Pasa los objetos old_record y new_record completos al frontend para que este calcule las diferencias.

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
    payload JSONB
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
        -- Usa DISTINCT ON para evitar usuarios duplicados por múltiples asignaciones
        SELECT DISTINCT ON (tu.user_id)
            tu.user_id as id,
            TRIM(CONCAT(tu.first_name, ' ', tu.last_name)) as full_name,
            tu.avatar_url
        FROM public.get_tenant_users(v_tenant_id) tu
    )
    SELECT
        c.id,
        'comment' as event_type,
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
        -- Mapea la acción de auditoría al event_type que espera el frontend
        CASE
            WHEN a.action = 'INSERT' THEN 'creation'
            WHEN a.action = 'UPDATE' THEN 'field_update'
            ELSE a.action -- Fallback
        END as event_type,
        a.created_at,
        a.user_id,
        u.full_name,
        u.avatar_url,
        -- Pasa los registros completos para que el frontend calcule la diferencia
        jsonb_build_object(
            'old_record', a.old_value,
            'new_record', a.new_value
        ) as payload
    FROM public.audit_logs a
    LEFT JOIN user_details u ON a.user_id = u.id
    WHERE a.object_type = p_resource_type AND a.object_id = p_resource_id

    ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.get_unified_chatter_feed IS 'Returns a combined, chronological feed of manual comments and automatic audit logs for a specific resource.';
-- MIGRACIÓN INTEGRAL DEL CHATTER
-- PARTE 1: Se corrigen las políticas de RLS para que sean estrictas a nivel de tenant.
-- PARTE 2: Se simplifica la función get_unified_chatter_feed para que solo devuelva datos crudos.
-- La lógica de negocio para enriquecer los datos se mueve a la Edge Function.

-- PARTE 1: Políticas de RLS

-- Limpieza de políticas anteriores
DROP POLICY IF EXISTS "Allow tenant members to view their tenant's audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Super admins can view all audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Tenant super admins can view their tenant's audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Allow users to read comments in their tenant" ON public.chatter_comments;

-- Nueva política estricta para audit_logs
CREATE POLICY "Allow read access to tenant members"
ON public.audit_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM jsonb_array_elements(auth.jwt() -> 'app_metadata' -> 'assignments') AS elem
    WHERE (elem ->> 'tenant_id')::uuid = audit_logs.tenant_id
  )
);

-- Nueva política estricta para chatter_comments
CREATE POLICY "Allow read access to tenant members"
ON public.chatter_comments FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM jsonb_array_elements(auth.jwt() -> 'app_metadata' -> 'assignments') AS elem
    WHERE (elem ->> 'tenant_id')::uuid = chatter_comments.tenant_id
  )
);


-- PARTE 2: Función SQL Simplificada

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
    payload JSONB
) AS $$
BEGIN
    -- Esta función ya no se preocupa por los permisos de usuario o la resolución de nombres.
    -- Solo obtiene los datos crudos. La seguridad la impone RLS y la lógica de negocio la Edge Function.
    RETURN QUERY
    SELECT
        c.id,
        'comment' as event_type,
        c.created_at,
        c.user_id,
        jsonb_build_object('text', c.comment_text) as payload
    FROM public.chatter_comments c
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
        jsonb_build_object(
            'old_record', a.old_value,
            'new_record', a.new_value
        ) as payload
    FROM public.audit_logs a
    WHERE a.object_type = p_resource_type AND a.object_id = p_resource_id

    ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.get_unified_chatter_feed IS 'Returns a raw, combined feed of comments and audit logs for a resource. User enrichment is handled by the calling Edge Function.';

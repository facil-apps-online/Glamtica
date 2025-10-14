-- MIGRACIÓN DE CORRECCIÓN DEL CHATTER
-- PARTE 1: Corrige la función log_audit_action para que capture el user_id.
-- PARTE 2: Corrige la función get_unified_chatter_feed para que interprete los tipos de evento correctamente.

-- PARTE 1: Corregir la captura de user_id
DROP FUNCTION IF EXISTS public.log_audit_action(text, text, uuid, jsonb, jsonb, inet, text, jsonb, uuid, uuid);
CREATE OR REPLACE FUNCTION public.log_audit_action(
    p_action text,
    p_object_type text DEFAULT NULL,
    p_object_id uuid DEFAULT NULL,
    p_old_value jsonb DEFAULT NULL,
    p_new_value jsonb DEFAULT NULL,
    p_ip_address inet DEFAULT NULL,
    p_user_agent text DEFAULT NULL,
    p_metadata jsonb DEFAULT NULL,
    p_tenant_id uuid DEFAULT NULL,
    p_branch_id uuid DEFAULT NULL
)
RETURNS void AS $$
DECLARE
    v_user_id uuid;
    v_tenant_id uuid;
    v_branch_id uuid;
BEGIN
    SELECT auth.uid() INTO v_user_id;
    v_tenant_id := COALESCE(p_tenant_id, current_setting('app.tenant_id', true)::uuid);
    v_branch_id := COALESCE(p_branch_id, current_setting('app.branch_id', true)::uuid);
    INSERT INTO public.audit_logs (user_id, tenant_id, branch_id, action, object_type, object_id, old_value, new_value, ip_address, user_agent, metadata)
    VALUES (v_user_id, v_tenant_id, v_branch_id, p_action, p_object_type, p_object_id, p_old_value, p_new_value, p_ip_address, p_user_agent, p_metadata);
END;
$$ LANGUAGE plpgsql SECURITY INVOKER; -- Changed to INVOKER

-- PARTE 2: Corregir la interpretación de event_type
DROP FUNCTION IF EXISTS public.get_unified_chatter_feed(TEXT, UUID);
CREATE OR REPLACE FUNCTION public.get_unified_chatter_feed(
    p_resource_type TEXT,
    p_resource_id UUID
)
RETURNS TABLE (id UUID, event_type TEXT, created_at TIMESTAMPTZ, user_id UUID, payload JSONB) AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id, 'comment' as event_type, c.created_at, c.user_id, jsonb_build_object('text', c.comment_text) as payload
    FROM public.chatter_comments c
    WHERE c.resource_type = p_resource_type AND c.resource_id = p_resource_id
    UNION ALL
    SELECT
        a.id,
        CASE
            WHEN a.action LIKE 'INSERT%' THEN 'creation'
            WHEN a.action LIKE 'UPDATE%' THEN 'field_update'
            ELSE a.action
        END as event_type,
        a.created_at,
        a.user_id,
        jsonb_build_object('old_record', a.old_value, 'new_record', a.new_value) as payload
    FROM public.audit_logs a
    WHERE a.object_type = p_resource_type AND a.object_id = p_resource_id
    ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql;

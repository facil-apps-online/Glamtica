CREATE OR REPLACE FUNCTION public.log_audit_action(
    p_action text,
    p_object_type text DEFAULT NULL,
    p_object_id uuid DEFAULT NULL,
    p_old_value jsonb DEFAULT NULL,
    p_new_value jsonb DEFAULT NULL,
    p_ip_address inet DEFAULT NULL,
    p_user_agent text DEFAULT NULL,
    p_metadata jsonb DEFAULT NULL,
    p_tenant_id uuid DEFAULT NULL, -- Nuevo parámetro
    p_branch_id uuid DEFAULT NULL  -- Nuevo parámetro
)
RETURNS void AS $$
DECLARE
    v_user_id uuid;
    v_tenant_id uuid;
    v_branch_id uuid;
BEGIN
    -- Intenta obtener user_id del contexto de la sesión actual
    SELECT auth.uid() INTO v_user_id;
    
    -- Prioriza los IDs pasados como parámetro, luego el contexto de la sesión
    v_tenant_id := COALESCE(p_tenant_id, current_setting('app.tenant_id', true)::uuid);
    v_branch_id := COALESCE(p_branch_id, current_setting('app.branch_id', true)::uuid);

    INSERT INTO public.audit_logs (
        user_id,
        tenant_id,
        branch_id,
        action,
        object_type,
        object_id,
        old_value,
        new_value,
        ip_address,
        user_agent,
        metadata
    ) VALUES (
        v_user_id,
        v_tenant_id,
        v_branch_id,
        p_action,
        p_object_type,
        p_object_id,
        p_old_value,
        p_new_value,
        p_ip_address,
        p_user_agent,
        p_metadata
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
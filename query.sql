-- Eliminar la función existente (todas las sobrecargas si las hubiera)
DROP FUNCTION IF EXISTS public.set_session_context(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.set_session_context(TEXT);
DROP FUNCTION IF EXISTS public.set_session_context(JSONB);

-- Recrear la función set_session_context (sin cambios, solo para asegurar que esté presente)
CREATE OR REPLACE FUNCTION public.set_session_context(
    p_jwt_token TEXT,
    p_jwt_secret TEXT
)
RETURNS VOID AS $$
DECLARE
    claims JSONB;
    user_id_val UUID;
    tenant_id_val UUID;
    branch_id_val UUID;
    role_name_val TEXT;
BEGIN
    IF p_jwt_token IS NULL OR p_jwt_token = '' THEN
        PERFORM set_config('app.current_user_id', '', FALSE);
        PERFORM set_config('app.current_tenant_id', '', FALSE);
        PERFORM set_config('app.current_branch_id', '', FALSE);
        PERFORM set_config('app.current_role_name', '', FALSE);
        RETURN;
    END IF;

    claims := public.verify(p_jwt_token, p_jwt_secret);

    user_id_val := (claims->>'sub')::UUID;
    tenant_id_val := (claims->>'tenant_id')::UUID;
    branch_id_val := (claims->>'branch_id')::UUID;
    role_name_val := claims->>'role';

    PERFORM set_config('app.current_user_id', user_id_val::text, FALSE);
    PERFORM set_config('app.current_tenant_id', tenant_id_val::text, FALSE);
    PERFORM set_config('app.current_branch_id', branch_id_val::text, FALSE);
    PERFORM set_config('app.current_role_name', role_name_val::text, FALSE);

EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error setting session context: %', SQLERRM;
        PERFORM set_config('app.current_user_id', '', FALSE);
        PERFORM set_config('app.current_tenant_id', '', FALSE);
        PERFORM set_config('app.current_branch_id', '', FALSE);
        PERFORM set_config('app.current_role_name', '', FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.set_session_context(TEXT, TEXT) TO authenticated;


-- Simplificar la función get_current_role_name para depuración
CREATE OR REPLACE FUNCTION public.get_current_role_name()
RETURNS TEXT AS $$
BEGIN
  RETURN NULLIF(current_setting('app.current_role_name', TRUE), '');
END;
$$ LANGUAGE plpgsql STABLE;
-- Crear la función RPC para actualizar masivamente las asignaciones de un usuario.
-- Esta es la función principal para el "Gestor de Asignaciones". Recibe un
-- array JSON y sincroniza la base de datos con el estado enviado desde el frontend.

CREATE OR REPLACE FUNCTION public.update_user_assignments(
    p_user_id UUID,
    p_tenant_id UUID,
    p_assignments JSONB,
    p_invoking_user_role TEXT -- Para la guarda de seguridad
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    assignment RECORD;
BEGIN
    -- 1. Guarda de Seguridad
    IF p_invoking_user_role NOT IN ('super_admin', 'tenant_super_admin', 'tenant_admin') THEN
        RETURN jsonb_build_object('success', false, 'message', 'Acceso denegado. Permisos insuficientes.');
    END IF;

    -- NOTA: Una validación adicional para 'tenant_admin' podría ser verificar
    -- que solo está asignando roles/sucursales que tiene permitido gestionar.
    -- Por ahora, confiamos en que el frontend filtra las opciones correctamente.

    -- 2. Iniciar transacción (implícita en plpgsql, pero la lógica es transaccional)
    
    -- 3. Borrar todas las asignaciones existentes (no pendientes) para este usuario en este tenant.
    -- Se mantiene la asignación 'pending_configuration' si existe, para no perder al usuario.
    DELETE FROM public.user_assignments
    WHERE user_id = p_user_id
      AND tenant_id = p_tenant_id
      AND status != 'pending_configuration';

    -- 4. Recorrer el JSON y crear las nuevas asignaciones
    FOR assignment IN SELECT * FROM jsonb_to_recordset(p_assignments) AS x(branch_id UUID, role_id UUID)
    LOOP
        INSERT INTO public.user_assignments (user_id, tenant_id, branch_id, role_id, status)
        VALUES (p_user_id, p_tenant_id, assignment.branch_id, assignment.role_id, 'active');
    END LOOP;

    -- 5. Si después de todo, el usuario no tiene asignaciones, podría ser un error.
    -- Opcionalmente, se podría verificar y manejar este caso.

    RETURN jsonb_build_object('success', true, 'message', 'Asignaciones actualizadas correctamente.');

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'message', 'Ha ocurrido un error inesperado: ' || SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_user_assignments(UUID, UUID, JSONB, TEXT) TO authenticated;

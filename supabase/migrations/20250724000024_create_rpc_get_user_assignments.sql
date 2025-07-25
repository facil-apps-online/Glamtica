-- Crear la función RPC para obtener todas las asignaciones de un usuario específico en un tenant.
-- Esta función es necesaria para el "Gestor de Asignaciones", que necesita cargar
-- el estado actual de un usuario antes de permitir la edición.

CREATE OR REPLACE FUNCTION public.get_user_assignments(
    p_user_id UUID,
    p_tenant_id UUID
)
RETURNS TABLE (
    assignment_id UUID,
    branch_id UUID,
    branch_name TEXT,
    role_id UUID,
    role_name TEXT,
    status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Esta función es de solo lectura, pero la hacemos SECURITY DEFINER
    -- para asegurar que cualquier rol administrativo pueda ver las asignaciones
    -- de otro usuario dentro de su tenant para poder gestionarlas.
    -- La seguridad a nivel de API debe controlar quién puede llamar a esta función.

    RETURN QUERY
    SELECT
        ua.id as assignment_id,
        ua.branch_id,
        b.name as branch_name,
        ua.role_id,
        r.name as role_name,
        ua.status
    FROM
        public.user_assignments ua
    LEFT JOIN
        public.branches b ON ua.branch_id = b.id
    LEFT JOIN
        public.roles r ON ua.role_id = r.id
    WHERE
        ua.user_id = p_user_id AND ua.tenant_id = p_tenant_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_assignments(UUID, UUID) TO authenticated;

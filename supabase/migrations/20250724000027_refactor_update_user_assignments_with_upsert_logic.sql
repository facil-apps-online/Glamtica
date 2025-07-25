-- Refactorizar la función update_user_assignments para que use una lógica
-- de sincronización inteligente (UPSERT/DELETE) en lugar de borrar y recrear.
-- Esto preserva los IDs de asignación y es más eficiente.

DROP FUNCTION IF EXISTS public.update_user_assignments(uuid, uuid, jsonb, text);

CREATE OR REPLACE FUNCTION public.update_user_assignments(
    p_user_id UUID,
    p_tenant_id UUID,
    p_assignments JSONB,
    p_invoking_user_role TEXT
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- 1. Guarda de Seguridad
    IF p_invoking_user_role NOT IN ('super_admin', 'tenant_super_admin', 'tenant_admin') THEN
        RETURN jsonb_build_object('success', false, 'message', 'Acceso denegado. Permisos insuficientes.');
    END IF;

    -- 2. Eliminar asignaciones que ya no están en el JSON enviado
    DELETE FROM public.user_assignments ua
    WHERE ua.user_id = p_user_id
      AND ua.tenant_id = p_tenant_id
      AND NOT EXISTS (
          SELECT 1
          FROM jsonb_to_recordset(p_assignments) AS incoming(role_id UUID, branch_id UUID, status TEXT)
          WHERE incoming.role_id = ua.role_id AND incoming.branch_id = ua.branch_id
      );

    -- 3. Actualizar las asignaciones existentes cuyo estado ha cambiado
    UPDATE public.user_assignments ua
    SET status = incoming.status
    FROM jsonb_to_recordset(p_assignments) AS incoming(role_id UUID, branch_id UUID, status TEXT)
    WHERE ua.user_id = p_user_id
      AND ua.tenant_id = p_tenant_id
      AND ua.role_id = incoming.role_id
      AND ua.branch_id = incoming.branch_id
      AND ua.status IS DISTINCT FROM incoming.status;

    -- 4. Insertar las nuevas asignaciones que no existen en la base de datos
    INSERT INTO public.user_assignments (user_id, tenant_id, role_id, branch_id, status)
    SELECT
        p_user_id,
        p_tenant_id,
        incoming.role_id,
        incoming.branch_id,
        incoming.status::text
    FROM jsonb_to_recordset(p_assignments) AS incoming(role_id UUID, branch_id UUID, status TEXT)
    WHERE incoming.role_id IS NOT NULL
      AND incoming.branch_id IS NOT NULL
      AND NOT EXISTS (
          SELECT 1
          FROM public.user_assignments ua
          WHERE ua.user_id = p_user_id
            AND ua.tenant_id = p_tenant_id
            AND ua.role_id = incoming.role_id
            AND ua.branch_id = incoming.branch_id
      );

    RETURN jsonb_build_object('success', true, 'message', 'Asignaciones sincronizadas correctamente.');

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'message', 'Ha ocurrido un error inesperado: ' || SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_user_assignments(UUID, UUID, JSONB, TEXT) TO authenticated;
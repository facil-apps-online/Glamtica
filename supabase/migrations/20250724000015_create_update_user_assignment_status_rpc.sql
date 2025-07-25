-- Paso 3.2: Crear la función RPC para actualizar el estado de una asignación de usuario.

CREATE OR REPLACE FUNCTION public.update_user_assignment_status(
  p_assignment_id uuid,
  p_new_status TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tenant_id uuid;
  requesting_user_role TEXT;
BEGIN
  -- Obtener el tenant_id de la asignación que se está modificando
  SELECT tenant_id INTO v_tenant_id FROM public.user_assignments WHERE id = p_assignment_id;

  -- Obtener el rol del usuario que llama DENTRO de ese tenant
  SELECT r.name INTO requesting_user_role
  FROM public.user_assignments ua
  JOIN public.roles r ON ua.role_id = r.id
  WHERE ua.user_id = auth.uid() AND ua.tenant_id = v_tenant_id;

  -- Comprobar permisos: solo super_admin o administradores del tenant pueden cambiar estados
  IF requesting_user_role IS NULL OR (requesting_user_role != 'super_admin' AND requesting_user_role NOT LIKE 'tenant_%_admin') THEN
    RAISE EXCEPTION 'Access denied. You do not have permission to update user status in this tenant.';
  END IF;

  -- Actualizar el estado de la asignación
  UPDATE public.user_assignments
  SET status = p_new_status
  WHERE id = p_assignment_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_user_assignment_status(uuid, text) TO authenticated;

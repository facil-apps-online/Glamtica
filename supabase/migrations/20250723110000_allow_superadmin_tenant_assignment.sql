-- Migración para modificar el trigger de validación de usuarios.
-- Permite que el rol 'super_admin' pueda tener un 'tenant_id' asignado,
-- pero mantiene la restricción de no poder tener un 'branch_id'.
-- Esto es necesario para poder asociar al super_admin con el tenant "Glamtica Control Panel".

CREATE OR REPLACE FUNCTION public.validate_user_role_assignment()
RETURNS TRIGGER AS $$
DECLARE
  v_role_name TEXT;
BEGIN
  -- Obtener el nombre del rol basado en el role_id
  SELECT name INTO v_role_name FROM public.roles WHERE id = NEW.role_id;

  -- Aplicar lógica de validación basada en el nombre del rol
  IF v_role_name = 'super_admin' THEN
    -- La única restricción para el super_admin es que no puede tener una sucursal (branch) asignada.
    -- Se elimina la restricción sobre tenant_id.
    IF NEW.branch_id IS NOT NULL THEN
      RAISE EXCEPTION 'Invalid assignment: super_admin cannot be associated with a specific branch.';
    END IF;
  ELSIF v_role_name = 'tenant_super_admin' THEN
    IF NEW.tenant_id IS NULL THEN
      RAISE EXCEPTION 'Invalid assignment: tenant_super_admin must have a tenant_id.';
    END IF;
    IF NEW.branch_id IS NOT NULL THEN
      RAISE EXCEPTION 'Invalid assignment: tenant_super_admin cannot be associated with a specific branch.';
    END IF;
  ELSIF v_role_name IN ('tenant_admin', 'tenant_user') THEN
    IF NEW.tenant_id IS NULL OR NEW.branch_id IS NULL THEN
      RAISE EXCEPTION 'Invalid assignment: tenant_admin and tenant_user roles must have both a tenant_id and a branch_id.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Nota: No es necesario volver a crear el trigger en sí, ya que solo estamos
-- reemplazando la función a la que llama. El trigger 'trg_validate_user_role_assignment'
-- en la tabla 'public.users' seguirá funcionando y ahora usará esta nueva lógica.

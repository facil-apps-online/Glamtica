-- Paso 1: Añadir la columna display_name a la tabla de roles.
ALTER TABLE public.roles
ADD COLUMN display_name TEXT;

-- Paso 2: Deshabilitar temporalmente los triggers para poblar los datos de forma segura.
-- Esto es necesario para evitar que el trigger de auditoría falle, ya que la tabla roles es global y no tiene tenant_id.
ALTER TABLE public.roles DISABLE TRIGGER USER;

-- Paso 3: Poblar la nueva columna con los nombres amigables para los roles existentes.
UPDATE public.roles SET display_name = 'Super Administrador' WHERE name = 'super_admin';
UPDATE public.roles SET display_name = 'Dueño del Negocio' WHERE name = 'tenant_super_admin';
UPDATE public.roles SET display_name = 'Administrador de Sucursal' WHERE name = 'tenant_admin';
UPDATE public.roles SET display_name = 'Empleado' WHERE name = 'tenant_user';

-- Paso 4: Volver a habilitar los triggers.
ALTER TABLE public.roles ENABLE TRIGGER USER;

-- Paso 5: Asegurarse de que no haya valores nulos.
-- Esto se hace después de poblar para evitar errores.
ALTER TABLE public.roles
ALTER COLUMN display_name SET NOT NULL;

-- Paso 6: Actualizar la función get_tenant_users para que devuelva el display_name.
DROP FUNCTION IF EXISTS public.get_tenant_users(uuid, text);
CREATE OR REPLACE FUNCTION public.get_tenant_users(
  target_tenant_id uuid,
  p_user_role TEXT
)
RETURNS TABLE (
  assignment_id uuid,
  user_id uuid,
  email text,
  first_name text,
  last_name text,
  role_name text,
  role_display_name text, -- <-- CAMPO AÑADIDO
  branch_name text,
  status text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_user_role = 'tenant_user' THEN
    RAISE EXCEPTION 'Access denied. Role tenant_user cannot perform this action.';
  END IF;

  RETURN QUERY
  SELECT
    ua.id as assignment_id,
    u.id as user_id,
    u.email,
    u.first_name,
    u.last_name,
    r.name as role_name,
    r.display_name as role_display_name, -- <-- CAMPO AÑADIDO
    b.name as branch_name,
    ua.status
  FROM
    public.user_assignments ua
  JOIN
    public.users u ON ua.user_id = u.id
  LEFT JOIN
    public.roles r ON ua.role_id = r.id
  LEFT JOIN
    public.branches b ON ua.branch_id = b.id
  WHERE
    ua.tenant_id = target_tenant_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_tenant_users(uuid, text) TO authenticated;


-- Paso 7: Actualizar la función get_user_assignments para que también devuelva el display_name.
DROP FUNCTION IF EXISTS public.get_user_assignments(uuid, uuid);
CREATE OR REPLACE FUNCTION public.get_user_assignments(
    p_user_id UUID,
    p_tenant_id UUID
)
RETURNS TABLE (
    assignment_id UUID,
    user_id UUID,
    tenant_id UUID,
    role_id UUID,
    branch_id UUID,
    status TEXT,
    role_name TEXT,
    role_display_name TEXT, -- <-- CAMPO AÑADIDO
    branch_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        ua.id AS assignment_id,
        ua.user_id,
        ua.tenant_id,
        ua.role_id,
        ua.branch_id,
        ua.status,
        r.name AS role_name,
        r.display_name AS role_display_name, -- <-- CAMPO AÑADIDO
        b.name AS branch_name
    FROM
        public.user_assignments ua
    LEFT JOIN
        public.roles r ON ua.role_id = r.id
    LEFT JOIN
        public.branches b ON ua.branch_id = b.id
    WHERE
        ua.user_id = p_user_id AND ua.tenant_id = p_tenant_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_user_assignments(uuid, uuid) TO authenticated;
-- Refactorización final de la función 'check_superadmin_exists'
-- Se actualiza la función para que consulte la nueva tabla 'user_assignments'
-- en lugar de la tabla 'users', que ya no contiene la columna 'role_id'.

CREATE OR REPLACE FUNCTION public.check_superadmin_exists()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    superadmin_exists BOOLEAN;
BEGIN
    -- La lógica ahora busca una asignación con el rol 'super_admin'
    -- en la nueva tabla 'user_assignments'.
    SELECT EXISTS (
        SELECT 1
        FROM public.user_assignments ua
        JOIN public.roles r ON ua.role_id = r.id
        WHERE r.name = 'super_admin'
    ) INTO superadmin_exists;

    RETURN superadmin_exists;
END;
$$;

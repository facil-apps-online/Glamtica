-- Crear función para verificar si un usuario ya existe por su email.
-- Esta función es de solo lectura y puede ser llamada de forma segura desde el frontend
-- para adaptar la interfaz de usuario dinámicamente.

CREATE OR REPLACE FUNCTION public.check_user_exists_by_email(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.users
        WHERE email = p_email
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_user_exists_by_email(TEXT) TO public;

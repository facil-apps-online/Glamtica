-- Mueve la lógica de validación de asignaciones de la tabla 'users' a 'user_assignments'.

-- Paso 1: Eliminar el trigger obsoleto de la tabla 'users'.
-- Este trigger causaba errores al actualizar perfiles porque la tabla 'users' ya no contiene 'role_id'.
DROP TRIGGER IF EXISTS trg_validate_user_role_assignment ON public.users;

-- Paso 2: Crear un nuevo trigger en la tabla 'user_assignments'.
-- Esto asegura que la lógica de validación se aplique donde los datos de asignación realmente residen.
-- La función 'validate_user_role_assignment' se reutiliza sin cambios, ya que opera
-- sobre los campos que existen en la tabla 'user_assignments'.
CREATE TRIGGER trg_validate_assignment_consistency
BEFORE INSERT OR UPDATE ON public.user_assignments
FOR EACH ROW EXECUTE FUNCTION public.validate_user_role_assignment();

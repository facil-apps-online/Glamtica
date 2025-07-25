-- Paso 5: Limpieza Final.
-- Elimina la columna 'is_active' de la tabla 'public.users'.
-- Esta columna es ahora obsoleta, ya que el estado de activación se gestiona
-- a través de la columna 'status' en la tabla 'user_assignments'.

ALTER TABLE public.users
DROP COLUMN is_active;

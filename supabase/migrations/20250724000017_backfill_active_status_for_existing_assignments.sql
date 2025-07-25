-- Migración de datos para corregir el estado de las asignaciones existentes.
-- Actualiza todas las filas en user_assignments donde el 'status' es NULL
-- y lo establece en 'active'.
-- Esto es necesario porque el DEFAULT solo se aplica a las nuevas filas.

UPDATE public.user_assignments
SET status = 'active'
WHERE status IS NULL;

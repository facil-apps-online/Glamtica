-- Paso 1.1: Añadir la columna 'status' a la tabla user_assignments.
-- Esta columna gestionará el estado de activación de un usuario para un tenant específico.
-- No se elimina la columna 'is_active' de 'public.users' todavía para mantener la compatibilidad con el login actual.

ALTER TABLE public.user_assignments
ADD COLUMN status TEXT NOT NULL DEFAULT 'active';

COMMENT ON COLUMN public.user_assignments.status IS 'El estado de la asignación del usuario (ej. active, inactive, suspended).';

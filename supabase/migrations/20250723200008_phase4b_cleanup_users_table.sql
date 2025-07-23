-- FASE 4b: Limpieza Final (Corregido)
-- Esta migración elimina las columnas de asignación redundantes de la tabla 'users'.
-- Se ejecuta después de la refactorización de la política de RLS para evitar errores de dependencia.

-- Eliminar la columna 'role_id'
ALTER TABLE public.users
DROP COLUMN IF EXISTS role_id;

-- Eliminar la columna 'tenant_id'
ALTER TABLE public.users
DROP COLUMN IF EXISTS tenant_id;

-- Eliminar la columna 'branch_id'
ALTER TABLE public.users
DROP COLUMN IF EXISTS branch_id;

COMMENT ON TABLE public.users IS 'Almacena la información de identidad principal de los usuarios (nombre, email, contraseña). Los permisos y membresías se gestionan en la tabla user_assignments.';

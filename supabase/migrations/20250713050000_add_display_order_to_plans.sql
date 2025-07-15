-- Migración para añadir un campo de orden de visualización a los planes de suscripción

-- 1. Añadir la columna `display_order` a la tabla `subscription_plans`
ALTER TABLE public.subscription_plans
ADD COLUMN IF NOT EXISTS display_order INT NOT NULL DEFAULT 0;

-- 2. Asignar un orden inicial lógico a los planes existentes
UPDATE public.subscription_plans SET display_order = 10 WHERE name = 'Mensual';
UPDATE public.subscription_plans SET display_order = 20 WHERE name = 'Semestral';
UPDATE public.subscription_plans SET display_order = 30 WHERE name = 'Anual';

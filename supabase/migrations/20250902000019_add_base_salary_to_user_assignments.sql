ALTER TABLE public.user_assignments
ADD COLUMN base_salary NUMERIC(10, 2) NOT NULL DEFAULT 0.00;

COMMENT ON COLUMN public.user_assignments.base_salary IS 'Salario base mensual del usuario para esta asignación específica.';

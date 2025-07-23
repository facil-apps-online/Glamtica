-- Asigna la propiedad del sistema al tenant con UUID 0.
-- Este tenant será utilizado para gestionar las configuraciones de pago globales.

UPDATE public.tenants
SET is_system_owner = true
WHERE id = '00000000-0000-0000-0000-000000000000';

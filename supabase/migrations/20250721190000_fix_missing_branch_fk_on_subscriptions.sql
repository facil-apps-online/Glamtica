-- Corregir el esquema: Añadir la clave foránea que falta a tenant_subscriptions.
-- Esto es necesario para que la API de Supabase pueda resolver la relación con la tabla de sucursales.

ALTER TABLE public.tenant_subscriptions
ADD CONSTRAINT tenant_subscriptions_branch_id_fkey
FOREIGN KEY (branch_id) REFERENCES public.branches(id)
ON DELETE SET NULL;

COMMENT ON CONSTRAINT tenant_subscriptions_branch_id_fkey ON public.tenant_subscriptions IS 'Define la relación entre una suscripción y una sucursal específica.';

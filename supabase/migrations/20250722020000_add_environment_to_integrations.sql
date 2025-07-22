-- Migración para añadir la funcionalidad de entornos (Test/Producción) a las integraciones.

-- Paso 1: Añadir el modo de integración global a nivel de tenant.
-- Esto permitirá cambiar todas las integraciones de un tenant entre 'production' y 'test' con un solo switch.
ALTER TABLE public.tenants
ADD COLUMN IF NOT EXISTS integrations_mode TEXT NOT NULL DEFAULT 'production';

COMMENT ON COLUMN public.tenants.integrations_mode IS 'Define si las integraciones del tenant operan en modo "production" o "test".';


-- Paso 2: Añadir el entorno a nivel de cada integración de tenant.
-- Esto permite almacenar credenciales de 'production' y 'test' para el mismo proveedor.
ALTER TABLE public.tenant_integrations
ADD COLUMN IF NOT EXISTS environment TEXT NOT NULL DEFAULT 'production';

COMMENT ON COLUMN public.tenant_integrations.environment IS 'Define si este juego de credenciales es para "production" o "test".';


-- Paso 3: Actualizar la restricción de unicidad para incluir el nuevo campo 'environment'.
-- Primero, eliminamos la restricción antigua que solo cubría tenant_id y provider.
ALTER TABLE public.tenant_integrations
DROP CONSTRAINT IF EXISTS unique_tenant_provider;

-- Luego, creamos la nueva restricción que incluye el entorno.
ALTER TABLE public.tenant_integrations
ADD CONSTRAINT unique_tenant_provider_environment UNIQUE (tenant_id, provider, environment);

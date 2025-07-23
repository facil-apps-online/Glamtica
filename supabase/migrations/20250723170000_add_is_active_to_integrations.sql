-- Añade la columna is_active a la tabla tenant_integrations para permitir activar/desactivar configuraciones.
ALTER TABLE public.tenant_integrations
ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT false;

-- Crea un índice único para asegurar que solo una integración por proveedor y tenant pueda estar activa.
-- La condición `WHERE is_active IS TRUE` asegura que la unicidad solo se aplique
-- a las integraciones marcadas como activas, permitiendo múltiples `false` valores.
CREATE UNIQUE INDEX unique_active_integration_per_provider
ON public.tenant_integrations (tenant_id, provider)
WHERE (is_active = true);

-- Comentario sobre la nueva columna para futura referencia.
COMMENT ON COLUMN public.tenant_integrations.is_active IS 'Indica si la configuración de una integración es la activa para su proveedor. Solo una puede estar activa por proveedor y tenant.';

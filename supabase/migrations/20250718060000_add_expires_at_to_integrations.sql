-- Añadir la columna expires_at a la tabla de integraciones para gestionar el refresco de tokens.
ALTER TABLE public.tenant_integrations
ADD COLUMN expires_at TIMESTAMPTZ;

COMMENT ON COLUMN public.tenant_integrations.expires_at IS 'Timestamp de cuando expira el access_token. Usado para la lógica de refresco.';

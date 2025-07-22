-- Migración para estandarizar las columnas de credenciales en tenant_integrations.

-- Eliminar las columnas antiguas si existen para asegurar un estado limpio.
ALTER TABLE public.tenant_integrations
DROP COLUMN IF EXISTS encrypted_refresh_token,
DROP COLUMN IF EXISTS encryption_nonce;

-- Añadir las nuevas columnas estandarizadas.
ALTER TABLE public.tenant_integrations
ADD COLUMN IF NOT EXISTS encrypted_credentials TEXT,
ADD COLUMN IF NOT EXISTS nonce TEXT;

COMMENT ON COLUMN public.tenant_integrations.encrypted_credentials IS 'Las credenciales sensibles (ej. refresh token, API key), cifradas y en formato Base64.';
COMMENT ON COLUMN public.tenant_integrations.nonce IS 'El vector de inicialización (IV) o nonce para el cifrado, en Base64.';

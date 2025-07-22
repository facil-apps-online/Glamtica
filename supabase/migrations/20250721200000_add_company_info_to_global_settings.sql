-- Migración para enriquecer la tabla global_settings
-- Añadimos campos para la información de la empresa y la configuración del período de prueba.

ALTER TABLE public.global_settings
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS contact_email TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS trial_duration_days INT NOT NULL DEFAULT 14;

COMMENT ON COLUMN public.global_settings.company_name IS 'El nombre legal de la empresa que opera el servicio (ej. Glamtica S.A.S).';
COMMENT ON COLUMN public.global_settings.contact_email IS 'El correo electrónico de contacto principal para asuntos administrativos o de soporte.';
COMMENT ON COLUMN public.global_settings.address IS 'La dirección física o fiscal de la empresa.';
COMMENT ON COLUMN public.global_settings.trial_duration_days IS 'La duración en días del período de prueba para nuevos tenants.';

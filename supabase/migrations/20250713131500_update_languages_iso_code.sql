-- Corregir la estructura de la tabla 'languages' para soportar códigos de localización completos

-- 1. Modificar el tipo de la columna 'iso_code' para aceptar códigos más largos
ALTER TABLE public.languages
ALTER COLUMN iso_code TYPE VARCHAR(10);

-- 2. Actualizar los datos existentes para reflejar un formato de localización completo
-- Asumimos un país por defecto para los idiomas base para mantener la consistencia.
UPDATE public.languages SET iso_code = 'es-ES' WHERE iso_code = 'es';
UPDATE public.languages SET iso_code = 'en-US' WHERE iso_code = 'en';
UPDATE public.languages SET iso_code = 'fr-FR' WHERE iso_code = 'fr';
UPDATE public.languages SET iso_code = 'de-DE' WHERE iso_code = 'de';
UPDATE public.languages SET iso_code = 'pt-PT' WHERE iso_code = 'pt';
UPDATE public.languages SET iso_code = 'it-IT' WHERE iso_code = 'it';

-- 3. Añadir un comentario para aclarar el nuevo formato
COMMENT ON COLUMN public.languages.iso_code IS 'Código de localización completo (ej. ''es-CO'', ''en-US'').';

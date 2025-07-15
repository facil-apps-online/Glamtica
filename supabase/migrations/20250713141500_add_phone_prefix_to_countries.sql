-- Añadir la columna phone_prefix a la tabla de países

-- 1. Añadir la nueva columna
ALTER TABLE public.countries
ADD COLUMN IF NOT EXISTS phone_prefix VARCHAR(10);

-- 2. Añadir un comentario para aclarar el propósito
COMMENT ON COLUMN public.countries.phone_prefix IS 'El prefijo telefónico internacional del país (ej. ''+57'' para Colombia).';

-- 3. Poblar la columna con datos para los países existentes
UPDATE public.countries SET phone_prefix = '+1' WHERE iso_code = 'US';
UPDATE public.countries SET phone_prefix = '+44' WHERE iso_code = 'GB';
UPDATE public.countries SET phone_prefix = '+1' WHERE iso_code = 'CA';
UPDATE public.countries SET phone_prefix = '+57' WHERE iso_code = 'CO';
UPDATE public.countries SET phone_prefix = '+52' WHERE iso_code = 'MX';
UPDATE public.countries SET phone_prefix = '+55' WHERE iso_code = 'BR';
UPDATE public.countries SET phone_prefix = '+34' WHERE iso_code = 'ES';
UPDATE public.countries SET phone_prefix = '+49' WHERE iso_code = 'DE';
UPDATE public.countries SET phone_prefix = '+33' WHERE iso_code = 'FR';
UPDATE public.countries SET phone_prefix = '+39' WHERE iso_code = 'IT';
UPDATE public.countries SET phone_prefix = '+351' WHERE iso_code = 'PT';

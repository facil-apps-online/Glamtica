ALTER TABLE public.countries
ADD COLUMN default_language_iso_code TEXT REFERENCES public.languages(iso_code) ON UPDATE CASCADE ON DELETE SET NULL;

-- Actualizar los idiomas por defecto para los países existentes
UPDATE public.countries
SET default_language_iso_code = 'es'
WHERE iso_code = 'CO'; -- Colombia

UPDATE public.countries
SET default_language_iso_code = 'en'
WHERE iso_code = 'US'; -- United States

UPDATE public.countries
SET default_language_iso_code = 'es'
WHERE iso_code = 'ES'; -- Spain

-- Puedes añadir más actualizaciones para otros países si es necesario

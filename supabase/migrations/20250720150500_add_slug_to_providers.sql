-- Añade una columna 'slug' a la tabla de proveedores de integración
-- para tener un identificador programático único.

ALTER TABLE public.integration_providers
ADD COLUMN slug TEXT;

-- Rellena los slugs para los registros existentes basados en el nombre
UPDATE public.integration_providers
SET slug = lower(regexp_replace(name, '[^a-zA-Z0-9]+', '_', 'g'))
WHERE slug IS NULL;

-- Ahora, establece la columna como NOT NULL y UNIQUE
ALTER TABLE public.integration_providers
ALTER COLUMN slug SET NOT NULL;

ALTER TABLE public.integration_providers
ADD CONSTRAINT integration_providers_slug_key UNIQUE (slug);

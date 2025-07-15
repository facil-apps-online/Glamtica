-- Añadir la columna para la localización por defecto a la tabla de países

-- 1. Añadir la nueva columna que referencia a la tabla 'languages' (que ahora son localizaciones)
ALTER TABLE public.countries
ADD COLUMN IF NOT EXISTS default_localization_id UUID REFERENCES public.languages(id) ON DELETE SET NULL;

-- 2. Añadir un comentario para aclarar el propósito de la nueva columna
COMMENT ON COLUMN public.countries.default_localization_id IS 'La localización por defecto para este país (ej. Español (Colombia))';

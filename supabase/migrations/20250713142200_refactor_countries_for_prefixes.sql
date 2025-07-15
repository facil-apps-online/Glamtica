-- Reestructurar la tabla 'countries' para usar la nueva tabla de prefijos

-- 1. Eliminar la columna redundante 'phone_prefix'
ALTER TABLE public.countries
DROP COLUMN IF EXISTS phone_prefix;

-- 2. Añadir la nueva columna que referencia a la tabla 'phone_prefixes'
ALTER TABLE public.countries
ADD COLUMN IF NOT EXISTS phone_prefix_id UUID REFERENCES public.phone_prefixes(id) ON DELETE SET NULL;

-- 3. Actualizar los países existentes para que apunten al prefijo correcto
UPDATE public.countries c
SET phone_prefix_id = p.id
FROM public.phone_prefixes p
WHERE c.iso_code = p.iso_code;

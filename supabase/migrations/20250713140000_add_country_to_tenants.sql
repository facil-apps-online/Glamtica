-- Añadir la columna country_id a la tabla de tenants

-- 1. Añadir la nueva columna que referencia a la tabla 'countries'
ALTER TABLE public.tenants
ADD COLUMN IF NOT EXISTS country_id UUID REFERENCES public.countries(id) ON DELETE SET NULL;

-- 2. Añadir un comentario para aclarar el propósito de la nueva columna
COMMENT ON COLUMN public.tenants.country_id IS 'El país al que pertenece el tenant.';

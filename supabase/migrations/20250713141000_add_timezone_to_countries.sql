-- Añadir la columna timezone a la tabla de países

-- 1. Añadir la nueva columna
ALTER TABLE public.countries
ADD COLUMN IF NOT EXISTS timezone TEXT;

-- 2. Añadir un comentario para aclarar el propósito
COMMENT ON COLUMN public.countries.timezone IS 'La zona horaria principal o por defecto para este país (ej. ''America/Bogota'').';

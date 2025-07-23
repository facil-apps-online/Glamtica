-- Paso 1: Añadir la columna permitiendo valores nulos temporalmente
ALTER TABLE public.payment_intents
ADD COLUMN environment TEXT;

-- Añadir el check de una vez
ALTER TABLE public.payment_intents
ADD CONSTRAINT payment_intents_environment_check
CHECK (environment IN ('test', 'production'));

-- Comentario sobre la columna
COMMENT ON COLUMN public.payment_intents.environment IS 'El entorno en el que se creó el intento de pago (test o production).';

-- Paso 2: Actualizar las filas existentes con un valor por defecto
-- Asumimos 'test' para los registros antiguos, ya que es el entorno de desarrollo.
UPDATE public.payment_intents
SET environment = 'test'
WHERE environment IS NULL;

-- Paso 3: Añadir la restricción NOT NULL ahora que todas las filas tienen un valor
ALTER TABLE public.payment_intents
ALTER COLUMN environment SET NOT NULL;
-- Fase 2: Mejorar la tabla de monedas con campos de formato

-- 1. Añadir las nuevas columnas a la tabla 'currencies'
ALTER TABLE public.currencies
ADD COLUMN IF NOT EXISTS symbol_position VARCHAR(10) NOT NULL DEFAULT 'before',
ADD COLUMN IF NOT EXISTS decimal_separator CHAR(1) NOT NULL DEFAULT '.',
ADD COLUMN IF NOT EXISTS thousands_separator CHAR(1) NOT NULL DEFAULT ',',
ADD COLUMN IF NOT EXISTS decimal_places INTEGER NOT NULL DEFAULT 2;

-- 2. Actualizar las monedas existentes con formatos comunes
UPDATE public.currencies
SET 
    symbol_position = 'before',
    decimal_separator = '.',
    thousands_separator = ',',
    decimal_places = 2
WHERE code IN ('USD', 'GBP', 'CAD', 'MXN');

UPDATE public.currencies
SET 
    symbol_position = 'after',
    decimal_separator = ',',
    thousands_separator = '.',
    decimal_places = 2
WHERE code = 'EUR';

UPDATE public.currencies
SET 
    symbol_position = 'before',
    decimal_separator = ',',
    thousands_separator = '.',
    decimal_places = 0
WHERE code = 'COP';

UPDATE public.currencies
SET 
    symbol_position = 'before',
    decimal_separator = ',',
    thousands_separator = '.',
    decimal_places = 2
WHERE code = 'BRL';

-- 3. Añadir comentarios para aclarar el propósito de las nuevas columnas
COMMENT ON COLUMN public.currencies.symbol_position IS 'Posición del símbolo monetario (ej. ''before'' para $100, ''after'' para 100€)';
COMMENT ON COLUMN public.currencies.decimal_separator IS 'Carácter para el separador de decimales (ej. ''.'' o '','')';
COMMENT ON COLUMN public.currencies.thousands_separator IS 'Carácter para el separador de miles (ej. '','' o ''.'')';
COMMENT ON COLUMN public.currencies.decimal_places IS 'Número de dígitos a mostrar después del separador decimal';

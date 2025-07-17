-- Migración para crear la tabla global_settings
-- Esta tabla almacenará configuraciones globales para toda la aplicación.
-- Se utilizará un único registro para facilitar el acceso y la actualización.

CREATE TABLE IF NOT EXISTS public.global_settings (
    id INT PRIMARY KEY CHECK (id = 1), -- Asegura que solo haya una fila
    base_currency_id UUID REFERENCES public.currencies(id) ON DELETE SET NULL,
    default_tax_rate NUMERIC(5, 2) DEFAULT 0.00, -- Tasa de impuesto por defecto (ej. 19.00 para 19%)
    default_tax_name TEXT DEFAULT 'IVA',
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insertar el registro de configuración inicial si no existe
INSERT INTO public.global_settings (id)
SELECT 1
WHERE NOT EXISTS (
    SELECT 1 FROM public.global_settings WHERE id = 1
);

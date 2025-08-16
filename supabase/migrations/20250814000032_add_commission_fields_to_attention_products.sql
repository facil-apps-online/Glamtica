ALTER TABLE public.attention_products
ADD COLUMN IF NOT EXISTS attention_service_id uuid REFERENCES public.attention_services(id) ON DELETE SET NULL,
-- No se puede añadir una clave foránea a auth.users directamente.
-- La integridad referencial se manejará a nivel de aplicación.
ADD COLUMN IF NOT EXISTS user_id uuid,
ADD COLUMN IF NOT EXISTS commission_rate numeric(5, 2) NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.attention_products.attention_service_id IS 'El servicio de la atención durante el cual se vendió el producto.';
COMMENT ON COLUMN public.attention_products.user_id IS 'El usuario que vendió el producto (referencia a auth.users.id).';
COMMENT ON COLUMN public.attention_products.commission_rate IS 'El porcentaje de comisión para el usuario en esta venta específica.';
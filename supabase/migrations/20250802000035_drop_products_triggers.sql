-- Eliminar triggers obsoletos de la tabla products

DROP TRIGGER IF EXISTS audit_products_changes ON public.products;
DROP TRIGGER IF EXISTS trigger_products_updated_at ON public.products;

-- MIGRATION: Add promotional_price to price_tariffs
-- This column will store a "list price" or "strikethrough price" to show discounts.
ALTER TABLE public.price_tariffs
ADD COLUMN promotional_price DECIMAL(10, 2) NULL;

COMMENT ON COLUMN public.price_tariffs.promotional_price IS 'Optional promotional price (e.g., a higher list price) to show a discount effect in the UI.';

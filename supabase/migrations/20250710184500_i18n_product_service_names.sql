
/*
  # Datos Multilingües para Productos y Servicios

  1. Alter Tables
    - `products` - Add `name_i18n` and `description_i18n` (jsonb) columns
    - `services` - Add `name_i18n` and `description_i18n` (jsonb) columns

  2. Data Migration (Optional)
    - Migrate existing `name` and `description` to `name_i18n` and `description_i18n` for a default language (e.g., 'es')

  3. Triggers
    - Update `updated_at` triggers for affected tables
*/

-- Add i18n columns to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS name_i18n jsonb,
ADD COLUMN IF NOT EXISTS description_i18n jsonb;

-- Add i18n columns to services table
ALTER TABLE services
ADD COLUMN IF NOT EXISTS name_i18n jsonb,
ADD COLUMN IF NOT EXISTS description_i18n jsonb;

-- Migrate existing data to i18n columns (assuming 'es' as default language)
UPDATE products
SET
  name_i18n = jsonb_build_object('es', name),
  description_i18n = jsonb_build_object('es', description)
WHERE name_i18n IS NULL;

UPDATE services
SET
  name_i18n = jsonb_build_object('es', name),
  description_i18n = jsonb_build_object('es', description)
WHERE name_i18n IS NULL;

-- Optional: Drop old columns if no longer needed after migration
-- ALTER TABLE products DROP COLUMN IF EXISTS name;
-- ALTER TABLE products DROP COLUMN IF EXISTS description;
-- ALTER TABLE services DROP COLUMN IF EXISTS name;
-- ALTER TABLE services DROP COLUMN IF EXISTS description;

-- Update updated_at triggers (already exist, but good to ensure they cover new columns)
-- No explicit action needed here as `update_updated_at_column()` function handles any column update.

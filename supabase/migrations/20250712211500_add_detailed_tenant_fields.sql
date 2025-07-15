-- Migración para mejorar la estructura de la tabla tenants
-- Elimina campos de dirección obsoletos y añade campos estructurados para
-- información fiscal, de contacto y de dirección física detallada.

-- 1. Eliminar las columnas de dirección antiguas y poco estructuradas.
ALTER TABLE tenants DROP COLUMN IF EXISTS address;
ALTER TABLE tenants DROP COLUMN IF EXISTS city;

-- 2. Añadir los nuevos campos detallados.
ALTER TABLE tenants
    ADD COLUMN legal_name TEXT,
    ADD COLUMN tax_id TEXT,
    ADD COLUMN billing_address TEXT,
    ADD COLUMN website TEXT,
    ADD COLUMN whatsapp_number TEXT,
    ADD COLUMN billing_email TEXT,
    ADD COLUMN physical_address_line1 TEXT,
    ADD COLUMN physical_address_line2 TEXT,
    ADD COLUMN physical_city TEXT,
    ADD COLUMN physical_state TEXT,
    ADD COLUMN physical_postal_code TEXT,
    ADD COLUMN latitude NUMERIC(10, 7),
    ADD COLUMN longitude NUMERIC(10, 7);

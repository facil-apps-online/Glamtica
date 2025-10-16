-- This migration updates the suppliers table to use a structured address schema
-- and removes the old single-field address.

-- Step 1: Drop the old 'address' column
ALTER TABLE public.suppliers DROP COLUMN IF EXISTS address;

-- Step 2: Add the new structured address columns
ALTER TABLE public.suppliers
ADD COLUMN IF NOT EXISTS address_line_1 text,
ADD COLUMN IF NOT EXISTS address_line_2 text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS state text,
ADD COLUMN IF NOT EXISTS postal_code text,
ADD COLUMN IF NOT EXISTS country text,
ADD COLUMN IF NOT EXISTS latitude numeric,
ADD COLUMN IF NOT EXISTS longitude numeric;

-- Step 3: Add comments to the new columns
COMMENT ON COLUMN public.suppliers.address_line_1 IS 'The first line of the address.';
COMMENT ON COLUMN public.suppliers.address_line_2 IS 'The second line of the address (e.g., apartment, suite).';
COMMENT ON COLUMN public.suppliers.city IS 'The city of the address.';
COMMENT ON COLUMN public.suppliers.state IS 'The state or province of the address.';
COMMENT ON COLUMN public.suppliers.postal_code IS 'The postal code of the address.';
COMMENT ON COLUMN public.suppliers.country IS 'The country of the address.';
COMMENT ON COLUMN public.suppliers.latitude IS 'The geographic latitude.';
COMMENT ON COLUMN public.suppliers.longitude IS 'The geographic longitude.';

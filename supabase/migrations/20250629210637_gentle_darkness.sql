/*
  # Add stylist_id to appointment_extra_services table

  1. Changes
    - Add `stylist_id` column to `appointment_extra_services` table
    - Add foreign key constraint to `stylists` table
    - Add index for performance

  2. Security
    - No RLS changes needed as table inherits existing security model
*/

-- Add stylist_id column to appointment_extra_services table
ALTER TABLE appointment_extra_services 
ADD COLUMN IF NOT EXISTS stylist_id uuid;

-- Add foreign key constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'appointment_extra_services_stylist_id_fkey'
  ) THEN
    ALTER TABLE appointment_extra_services 
    ADD CONSTRAINT appointment_extra_services_stylist_id_fkey 
    FOREIGN KEY (stylist_id) REFERENCES stylists(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_appointment_extra_services_stylist_id 
ON appointment_extra_services(stylist_id);
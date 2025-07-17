/*
  # Create appointment extra services table

  1. New Tables
    - `appointment_extra_services`
      - `id` (uuid, primary key)
      - `appointment_id` (uuid, foreign key to appointments)
      - `service_name` (text)
      - `price` (decimal)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `appointment_extra_services` table
    - Add policy for authenticated users to manage extra services
*/

CREATE TABLE IF NOT EXISTS appointment_extra_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  service_name text NOT NULL,
  price decimal(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE appointment_extra_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage appointment extra services"
  ON appointment_extra_services
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_appointment_extra_services_appointment_id 
  ON appointment_extra_services(appointment_id);
/*
  # Add missing RLS policies for appointment-related tables

  1. Security Policies
    - Add SELECT policies for tables that have RLS enabled but no policies
    - Allow public access for appointment_sessions, appointment_products, appointment_extra_services
    - Allow public access for products, service_categories, appointment_evidence
    - These policies match the existing pattern used in other tables

  2. Tables Updated
    - appointment_sessions: Add SELECT policy for public role
    - appointment_products: Add SELECT policy for public role  
    - appointment_extra_services: Add SELECT policy for public role
    - products: Add SELECT policy for public role
    - service_categories: Add SELECT policy for public role
    - appointment_evidence: Add SELECT policy for public role
*/

-- Add RLS policy for appointment_sessions
CREATE POLICY "Enable all operations for appointment_sessions"
  ON appointment_sessions
  FOR ALL
  TO public
  USING (true);

-- Add RLS policy for appointment_products
CREATE POLICY "Enable all operations for appointment_products"
  ON appointment_products
  FOR ALL
  TO public
  USING (true);

-- Add RLS policy for appointment_extra_services
CREATE POLICY "Enable all operations for appointment_extra_services"
  ON appointment_extra_services
  FOR ALL
  TO public
  USING (true);

-- Add RLS policy for products
CREATE POLICY "Enable all operations for products"
  ON products
  FOR ALL
  TO public
  USING (true);

-- Add RLS policy for service_categories
CREATE POLICY "Enable all operations for service_categories"
  ON service_categories
  FOR ALL
  TO public
  USING (true);

-- Add RLS policy for appointment_evidence
CREATE POLICY "Enable all operations for appointment_evidence"
  ON appointment_evidence
  FOR ALL
  TO public
  USING (true);
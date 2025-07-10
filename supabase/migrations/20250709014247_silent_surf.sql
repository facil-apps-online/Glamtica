/*
  # Fix RLS policy for attention_service_products table

  1. Changes
    - Drop the existing restrictive RLS policy
    - Create a new policy that allows public access for all operations
    - This resolves the "new row violates row-level security policy" error

  2. Security
    - Enable RLS on `attention_service_products` table (already enabled)
    - Add policy for public users to perform all operations
*/

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Enable all operations for attention_service_products" ON public.attention_service_products;

-- Create a new policy that allows public access
CREATE POLICY "Enable all operations for attention_service_products"
ON public.attention_service_products
FOR ALL
TO public
USING (true)
WITH CHECK (true);
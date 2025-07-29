-- Migration: 20250725000023_secure_products_table.sql
-- Description: Applies a robust RLS policy to the public.products table,
-- aligning it with the "Universe" architecture and multi-assignment model.

-- Step 1: Enable Row Level Security on the table.
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Step 2: Create the access control policy.
CREATE POLICY "Products Access Control" ON public.products
FOR ALL
USING (
    -- Allow access if the user has a 'super_admin' role in any of their assignments.
    EXISTS (
        SELECT 1
        FROM jsonb_array_elements(auth.jwt() -> 'app_metadata' -> 'assignments') as elem
        WHERE elem ->> 'role' = 'super_admin'
    )
    OR
    -- Allow access if the product's tenant_id is present in any of the user's assignments.
    EXISTS (
        SELECT 1
        FROM jsonb_array_elements(auth.jwt() -> 'app_metadata' -> 'assignments') as elem
        WHERE (elem ->> 'tenant_id')::uuid = tenant_id
    )
)
WITH CHECK (
    -- For writing (INSERT, UPDATE), allow if the user is a super_admin
    -- OR has an admin role for the specific tenant of the product.
    EXISTS (
        SELECT 1
        FROM jsonb_array_elements(auth.jwt() -> 'app_metadata' -> 'assignments') as elem
        WHERE 
            (elem ->> 'role' = 'super_admin') OR
            (
                (elem ->> 'tenant_id')::uuid = tenant_id AND
                elem ->> 'role' IN ('tenant_super_admin', 'tenant_admin')
            )
    )
);

-- COMMENT: Secures the public.products table with a comprehensive RLS policy for the Universe architecture.

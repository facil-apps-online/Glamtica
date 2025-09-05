-- MIGRATION TO FIX UNIQUE SKU INDEX ON COMBOS

-- Drop the existing unique index that incorrectly enforces uniqueness on NULL or empty SKUs
DROP INDEX IF EXISTS public.combos_tenant_id_sku_unique_idx;

-- Recreate the unique index to only enforce uniqueness on non-null and non-empty SKUs
CREATE UNIQUE INDEX combos_tenant_id_sku_unique_idx 
ON public.combos (tenant_id, sku) 
WHERE sku IS NOT NULL AND sku <> '';

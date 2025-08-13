-- 1. Añadir la columna branch_ids a la tabla suppliers
ALTER TABLE public.suppliers
ADD COLUMN branch_ids UUID[];

-- Comentario para la nueva columna
COMMENT ON COLUMN public.suppliers.branch_ids
IS 'Array de IDs de sucursales a las que este proveedor puede abastecer.';

-- 2. Poblar la nueva columna branch_ids basándose en los datos existentes en supplier_products
-- Agrupamos por proveedor y agregamos todos los branch_id únicos en un array.
WITH supplier_branches AS (
  SELECT
    supplier_id,
    array_agg(DISTINCT branch_id) as branches
  FROM
    public.supplier_products
  WHERE
    branch_id IS NOT NULL
  GROUP BY
    supplier_id
)
UPDATE
  public.suppliers s
SET
  branch_ids = sb.branches
FROM
  supplier_branches sb
WHERE
  s.id = sb.supplier_id;

-- 3. ¡NUEVO! Eliminar la política de RLS que depende de branch_id
DROP POLICY IF EXISTS tenant_branch_policy_supplier_products ON public.supplier_products;

-- 4. Eliminar la columna branch_id de la tabla supplier_products
ALTER TABLE public.supplier_products
DROP COLUMN IF EXISTS branch_id;
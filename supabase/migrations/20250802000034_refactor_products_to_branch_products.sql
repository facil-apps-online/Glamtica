-- Fase 1: Crear la tabla de relación branch-products

CREATE TABLE public.branch_products (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    branch_id uuid NOT NULL,
    product_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    selling_price numeric NOT NULL DEFAULT 0,
    stock_quantity integer NOT NULL DEFAULT 0,
    min_stock integer NULL DEFAULT 0,
    max_stock integer NULL DEFAULT 100,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT branch_products_pkey PRIMARY KEY (id),
    CONSTRAINT branch_products_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE,
    CONSTRAINT branch_products_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE,
    CONSTRAINT branch_products_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE,
    CONSTRAINT branch_products_branch_id_product_id_key UNIQUE (branch_id, product_id),
    CONSTRAINT branch_products_selling_price_check CHECK (selling_price >= 0),
    CONSTRAINT branch_products_stock_quantity_check CHECK (stock_quantity >= 0)
);

-- Habilitar RLS para la nueva tabla
ALTER TABLE public.branch_products ENABLE ROW LEVEL SECURITY;

-- Crear políticas de seguridad para la nueva tabla (ajustar según la lógica de la app)
CREATE POLICY "Enable read access for user's tenant" ON public.branch_products FOR SELECT USING (tenant_id = (select auth.jwt() ->> 'tenant_id')::uuid);
CREATE POLICY "Enable insert for user's tenant" ON public.branch_products FOR INSERT WITH CHECK (tenant_id = (select auth.jwt() ->> 'tenant_id')::uuid);
CREATE POLICY "Enable update for user's tenant" ON public.branch_products FOR UPDATE USING (tenant_id = (select auth.jwt() ->> 'tenant_id')::uuid);
CREATE POLICY "Enable delete for user's tenant" ON public.branch_products FOR DELETE USING (tenant_id = (select auth.jwt() ->> 'tenant_id')::uuid);


-- Añadir triggers de auditoría y actualización de timestamp
CREATE TRIGGER audit_branch_products_changes
AFTER INSERT OR UPDATE OR DELETE ON public.branch_products
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER trigger_branch_products_updated_at
BEFORE UPDATE ON public.branch_products
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- Fase 2: Migrar los datos de productos existentes a la nueva tabla

INSERT INTO public.branch_products (
    branch_id,
    product_id,
    tenant_id,
    selling_price,
    stock_quantity,
    min_stock,
    max_stock,
    is_active,
    created_at,
    updated_at
)
SELECT
    p.branch_id,
    p.id,
    p.tenant_id,
    p.price,
    p.stock_quantity,
    p.min_stock,
    p.max_stock,
    p.is_active,
    p.created_at,
    p.updated_at
FROM
    public.products p
WHERE
    p.branch_id IS NOT NULL;


-- Fase 3: Modificar la tabla 'products' para convertirla en un catálogo maestro

-- ¡CORRECCIÓN! Eliminar la política de seguridad dependiente PRIMERO
DROP POLICY tenant_branch_policy_products ON public.products;

-- Ahora sí, eliminar la llave foránea
ALTER TABLE public.products DROP CONSTRAINT fk_products_branch;

-- Y ahora, eliminar las columnas
ALTER TABLE public.products
DROP COLUMN branch_id,
DROP COLUMN price,
DROP COLUMN stock_quantity,
DROP COLUMN min_stock,
DROP COLUMN max_stock;

-- ¡NUEVO! Crear una nueva política de seguridad para la tabla de productos maestros
CREATE POLICY "Enable access based on tenant" ON public.products FOR ALL
USING (tenant_id = (select auth.jwt() ->> 'tenant_id')::uuid);
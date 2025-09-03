-- 1. Eliminar las funciones RPC que dependen de la tabla antigua
DROP FUNCTION IF EXISTS public.get_units_of_measure(p_tenant_id uuid);
DROP FUNCTION IF EXISTS public.create_unit_of_measure(p_tenant_id uuid, p_name text, p_abbreviation text);
DROP FUNCTION IF EXISTS public.update_unit_of_measure(p_id bigint, p_tenant_id uuid, p_name text, p_abbreviation text);
DROP FUNCTION IF EXISTS public.delete_unit_of_measure(p_id bigint, p_tenant_id uuid);

-- 2. Eliminar la columna de clave foránea de la tabla de productos
ALTER TABLE public.products DROP COLUMN IF EXISTS unit_of_measure_id;

-- 3. Eliminar la tabla antigua de unidades de medida
DROP TABLE IF EXISTS public.units_of_measure;

-- 4. Recrear la tabla units_of_measure con id UUID
CREATE TABLE public.units_of_measure (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    abbreviation TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT uom_tenant_abbreviation_unique UNIQUE (tenant_id, abbreviation)
);
COMMENT ON TABLE public.units_of_measure IS 'Stores units of measure for products, can be tenant-specific or global (null tenant_id).';

-- 5. Re-añadir la columna a la tabla de productos con el tipo UUID correcto
ALTER TABLE public.products
ADD COLUMN unit_of_measure_id UUID REFERENCES public.units_of_measure(id) ON DELETE SET NULL;
COMMENT ON COLUMN public.products.unit_of_measure_id IS 'The unit of measure for this product.';

-- 6. Recrear las funciones RPC para que usen UUID
CREATE OR REPLACE FUNCTION get_units_of_measure(p_tenant_id UUID)
RETURNS TABLE (id UUID, tenant_id UUID, name TEXT, abbreviation TEXT, created_at TIMESTAMPTZ, is_global BOOLEAN)
AS $$
BEGIN
    RETURN QUERY SELECT uom.id, uom.tenant_id, uom.name, uom.abbreviation, uom.created_at, (uom.tenant_id IS NULL) AS is_global
    FROM public.units_of_measure uom
    WHERE uom.tenant_id = p_tenant_id OR uom.tenant_id IS NULL
    ORDER BY uom.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION create_unit_of_measure(p_tenant_id UUID, p_name TEXT, p_abbreviation TEXT)
RETURNS UUID AS $$
DECLARE
    new_id UUID;
BEGIN
    INSERT INTO public.units_of_measure (tenant_id, name, abbreviation)
    VALUES (p_tenant_id, p_name, p_abbreviation)
    RETURNING id INTO new_id;
    RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_unit_of_measure(p_id UUID, p_tenant_id UUID, p_name TEXT, p_abbreviation TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE public.units_of_measure
    SET name = p_name, abbreviation = p_abbreviation
    WHERE id = p_id AND tenant_id = p_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION delete_unit_of_measure(p_id UUID, p_tenant_id UUID)
RETURNS VOID AS $$
BEGIN
    DELETE FROM public.units_of_measure
    WHERE id = p_id AND tenant_id = p_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

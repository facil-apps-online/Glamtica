-- Función para obtener unidades de medida (del tenant + globales)
CREATE OR REPLACE FUNCTION get_units_of_measure(p_tenant_id UUID)
RETURNS TABLE (
    id BIGINT,
    tenant_id UUID,
    name TEXT,
    abbreviation TEXT,
    created_at TIMESTAMPTZ,
    is_global BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        uom.id,
        uom.tenant_id,
        uom.name,
        uom.abbreviation,
        uom.created_at,
        (uom.tenant_id IS NULL) AS is_global
    FROM
        public.units_of_measure uom
    WHERE
        uom.tenant_id = p_tenant_id OR uom.tenant_id IS NULL
    ORDER BY
        uom.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para crear una unidad de medida para un tenant
CREATE OR REPLACE FUNCTION create_unit_of_measure(p_tenant_id UUID, p_name TEXT, p_abbreviation TEXT)
RETURNS BIGINT AS $$
DECLARE
    new_id BIGINT;
BEGIN
    INSERT INTO public.units_of_measure (tenant_id, name, abbreviation)
    VALUES (p_tenant_id, p_name, p_abbreviation)
    RETURNING id INTO new_id;
    RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para actualizar una unidad de medida de un tenant
CREATE OR REPLACE FUNCTION update_unit_of_measure(p_id BIGINT, p_tenant_id UUID, p_name TEXT, p_abbreviation TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE public.units_of_measure
    SET
        name = p_name,
        abbreviation = p_abbreviation
    WHERE
        id = p_id AND tenant_id = p_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para eliminar una unidad de medida de un tenant
CREATE OR REPLACE FUNCTION delete_unit_of_measure(p_id BIGINT, p_tenant_id UUID)
RETURNS VOID AS $$
BEGIN
    DELETE FROM public.units_of_measure
    WHERE id = p_id AND tenant_id = p_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

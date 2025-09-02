-- 1. Fix get_equipment to return IDs and is_active status
DROP FUNCTION IF EXISTS get_equipment(uuid, text, boolean, uuid, uuid);
CREATE OR REPLACE FUNCTION get_equipment(
    p_tenant_id uuid,
    p_search_term TEXT DEFAULT NULL,
    p_show_inactive BOOLEAN DEFAULT FALSE,
    p_type_id UUID DEFAULT NULL,
    p_brand_id UUID DEFAULT NULL
)
RETURNS TABLE(
    id uuid,
    name text,
    type_id uuid, -- Solución: Añadido para cargar el select
    brand_id uuid, -- Solución: Añadido para cargar el select
    is_active boolean, -- Solución: Añadido para el toggle
    type_name text,
    brand_name text,
    model text,
    serial_number text,
    purchase_date text,
    last_maintenance_date text,
    maintenance_frequency integer,
    maintenance_frequency_unit text,
    notes text,
    assigned_user_name text,
    branch_name text
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        e.id,
        e.name,
        e.type_id, -- Solución: Añadido
        e.brand_id, -- Solución: Añadido
        e.is_active, -- Solución: Añadido
        et.name as type_name,
        eb.name as brand_name,
        e.model,
        e.serial_number,
        to_char(e.purchase_date, 'YYYY-MM-DD') as purchase_date,
        to_char(e.last_maintenance_date, 'YYYY-MM-DD') as last_maintenance_date,
        e.maintenance_frequency,
        e.maintenance_frequency_unit,
        e.notes,
        u.first_name || ' ' || u.last_name as assigned_user_name,
        b.name as branch_name
    FROM
        equipment e
    LEFT JOIN
        equipment_types et ON e.type_id = et.id
    LEFT JOIN
        equipment_brands eb ON e.brand_id = eb.id
    LEFT JOIN
        equipment_assignments ea ON e.id = ea.equipment_id AND ea.return_date IS NULL
    LEFT JOIN
        users u ON ea.user_id = u.id
    LEFT JOIN
        branches b ON ea.branch_id = b.id
    WHERE
        e.tenant_id = p_tenant_id
        AND (p_search_term IS NULL OR p_search_term = '' OR e.name ILIKE '%' || p_search_term || '%' OR e.serial_number ILIKE '%' || p_search_term || '%')
        AND (p_show_inactive OR e.is_active = TRUE)
        AND (p_type_id IS NULL OR e.type_id = p_type_id)
        AND (p_brand_id IS NULL OR e.brand_id = p_brand_id);
END;
$$ LANGUAGE plpgsql;

-- 2. Fix create_equipment to handle is_active and prevent cast errors
DROP FUNCTION IF EXISTS create_equipment(jsonb);
CREATE OR REPLACE FUNCTION create_equipment(p_equipment_data jsonb)
RETURNS uuid AS $$
DECLARE
    new_equipment_id uuid;
BEGIN
    INSERT INTO equipment (tenant_id, name, type_id, brand_id, model, serial_number, purchase_date, last_maintenance_date, maintenance_frequency, maintenance_frequency_unit, notes, is_active)
    VALUES (
        (p_equipment_data->>'tenant_id')::uuid,
        p_equipment_data->>'name',
        (p_equipment_data->>'type_id')::uuid,
        NULLIF(p_equipment_data->>'brand_id', '')::uuid, -- Solución: Previene error si la marca es opcional
        p_equipment_data->>'model',
        p_equipment_data->>'serial_number',
        NULLIF(p_equipment_data->>'purchase_date', '')::date, -- Solución: Previene error con fechas vacías
        NULLIF(p_equipment_data->>'last_maintenance_date', '')::date, -- Solución: Previene error con fechas vacías
        (p_equipment_data->>'maintenance_frequency')::integer,
        p_equipment_data->>'maintenance_frequency_unit',
        p_equipment_data->>'notes',
        (p_equipment_data->>'is_active')::boolean -- Solución: Añadido para guardar el estado del toggle
    ) RETURNING id INTO new_equipment_id;
    RETURN new_equipment_id;
END;
$$ LANGUAGE plpgsql;

-- 3. Fix update_equipment to prevent cast errors
DROP FUNCTION IF EXISTS update_equipment(uuid, jsonb);
CREATE OR REPLACE FUNCTION update_equipment(p_equipment_id uuid, p_equipment_data jsonb)
RETURNS void AS $$
BEGIN
    UPDATE equipment
    SET
        name = p_equipment_data->>'name',
        type_id = (p_equipment_data->>'type_id')::uuid,
        brand_id = NULLIF(p_equipment_data->>'brand_id', '')::uuid, -- Solución: Previene error si la marca es opcional
        model = p_equipment_data->>'model',
        serial_number = p_equipment_data->>'serial_number',
        purchase_date = NULLIF(p_equipment_data->>'purchase_date', '')::date, -- Solución: Previene error con fechas vacías
        last_maintenance_date = NULLIF(p_equipment_data->>'last_maintenance_date', '')::date, -- Solución: Previene error con fechas vacías
        maintenance_frequency = (p_equipment_data->>'maintenance_frequency')::integer,
        maintenance_frequency_unit = p_equipment_data->>'maintenance_frequency_unit',
        notes = p_equipment_data->>'notes',
        is_active = (p_equipment_data->>'is_active')::boolean,
        updated_at = now()
    WHERE
        id = p_equipment_id;
END;
$$ LANGUAGE plpgsql;
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
    type_id uuid,
    brand_id uuid,
    is_active boolean,
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
    WITH tenant_users AS (
        SELECT
            tu.user_id,
            (tu.first_name || ' ' || tu.last_name) as full_name
        FROM get_tenant_users(p_tenant_id) tu
    )
    SELECT
        e.id,
        e.name,
        e.type_id,
        e.brand_id,
        e.is_active,
        et.name as type_name,
        eb.name as brand_name,
        e.model,
        e.serial_number,
        to_char(e.purchase_date, 'YYYY-MM-DD') as purchase_date,
        to_char(e.last_maintenance_date, 'YYYY-MM-DD') as last_maintenance_date,
        e.maintenance_frequency,
        e.maintenance_frequency_unit,
        e.notes,
        tu.full_name as assigned_user_name,
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
        tenant_users tu ON ea.user_id = tu.user_id
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
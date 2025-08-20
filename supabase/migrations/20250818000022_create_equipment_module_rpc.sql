-- Function to get equipment
CREATE OR REPLACE FUNCTION get_equipment(p_tenant_id uuid, p_branch_id uuid DEFAULT NULL, p_user_id uuid DEFAULT NULL)
RETURNS TABLE(
    id uuid,
    name text,
    type_name text,
    brand text,
    model text,
    serial_number text,
    assigned_user_name text,
    branch_name text
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        e.id,
        e.name,
        et.name as type_name,
        e.brand,
        e.model,
        e.serial_number,
        u.first_name || ' ' || u.last_name as assigned_user_name,
        b.name as branch_name
    FROM
        equipment e
    LEFT JOIN
        equipment_types et ON e.type_id = et.id
    LEFT JOIN
        equipment_assignments ea ON e.id = ea.equipment_id AND ea.return_date IS NULL
    LEFT JOIN
        users u ON ea.user_id = u.id
    LEFT JOIN
        branches b ON ea.branch_id = b.id
    WHERE
        e.tenant_id = p_tenant_id
        AND (p_branch_id IS NULL OR ea.branch_id = p_branch_id)
        AND (p_user_id IS NULL OR ea.user_id = p_user_id);
END;
$$ LANGUAGE plpgsql;

-- Function to create equipment
CREATE OR REPLACE FUNCTION create_equipment(p_equipment_data jsonb)
RETURNS uuid AS $$
DECLARE
    new_equipment_id uuid;
BEGIN
    INSERT INTO equipment (tenant_id, name, type_id, brand, model, serial_number, purchase_date, last_maintenance_date, maintenance_frequency, maintenance_frequency_unit, notes)
    VALUES (
        (p_equipment_data->>'tenant_id')::uuid,
        p_equipment_data->>'name',
        (p_equipment_data->>'type_id')::uuid,
        p_equipment_data->>'brand',
        p_equipment_data->>'model',
        p_equipment_data->>'serial_number',
        (p_equipment_data->>'purchase_date')::date,
        (p_equipment_data->>'last_maintenance_date')::date,
        (p_equipment_data->>'maintenance_frequency')::integer,
        p_equipment_data->>'maintenance_frequency_unit',
        p_equipment_data->>'notes'
    ) RETURNING id INTO new_equipment_id;
    RETURN new_equipment_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update equipment
CREATE OR REPLACE FUNCTION update_equipment(p_equipment_id uuid, p_equipment_data jsonb)
RETURNS void AS $$
BEGIN
    UPDATE equipment
    SET
        name = p_equipment_data->>'name',
        type_id = (p_equipment_data->>'type_id')::uuid,
        brand = p_equipment_data->>'brand',
        model = p_equipment_data->>'model',
        serial_number = p_equipment_data->>'serial_number',
        purchase_date = (p_equipment_data->>'purchase_date')::date,
        last_maintenance_date = (p_equipment_data->>'last_maintenance_date')::date,
        maintenance_frequency = (p_equipment_data->>'maintenance_frequency')::integer,
        maintenance_frequency_unit = p_equipment_data->>'maintenance_frequency_unit',
        notes = p_equipment_data->>'notes',
        is_active = (p_equipment_data->>'is_active')::boolean,
        updated_at = now()
    WHERE
        id = p_equipment_id;
END;
$$ LANGUAGE plpgsql;

-- Function to delete equipment
CREATE OR REPLACE FUNCTION delete_equipment(p_equipment_id uuid)
RETURNS void AS $$
BEGIN
    DELETE FROM equipment WHERE id = p_equipment_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get equipment assignments
CREATE OR REPLACE FUNCTION get_equipment_assignments(p_equipment_id uuid)
RETURNS TABLE(
    id uuid,
    user_name text,
    branch_name text,
    assignment_date date,
    return_date date
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ea.id,
        u.first_name || ' ' || u.last_name as user_name,
        b.name as branch_name,
        ea.assignment_date,
        ea.return_date
    FROM
        equipment_assignments ea
    JOIN
        users u ON ea.user_id = u.id
    JOIN
        branches b ON ea.branch_id = b.id
    WHERE
        ea.equipment_id = p_equipment_id;
END;
$$ LANGUAGE plpgsql;

-- Function to assign equipment to user
CREATE OR REPLACE FUNCTION assign_equipment_to_user(p_equipment_id uuid, p_user_id uuid, p_branch_id uuid, p_assignment_date date)
RETURNS uuid AS $$
DECLARE
    new_assignment_id uuid;
BEGIN
    INSERT INTO equipment_assignments (equipment_id, user_id, branch_id, assignment_date)
    VALUES (p_equipment_id, p_user_id, p_branch_id, p_assignment_date)
    RETURNING id INTO new_assignment_id;
    RETURN new_assignment_id;
END;
$$ LANGUAGE plpgsql;

-- Function to return equipment
CREATE OR REPLACE FUNCTION return_equipment(p_assignment_id uuid, p_return_date date)
RETURNS void AS $$
BEGIN
    UPDATE equipment_assignments
    SET
        return_date = p_return_date
    WHERE
        id = p_assignment_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get equipment maintenance history
CREATE OR REPLACE FUNCTION get_equipment_maintenance_history(p_equipment_id uuid)
RETURNS TABLE(
    id uuid,
    maintenance_date date,
    notes text
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        emh.id,
        emh.maintenance_date,
        emh.notes
    FROM
        equipment_maintenance_history emh
    WHERE
        emh.equipment_id = p_equipment_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create equipment maintenance record
CREATE OR REPLACE FUNCTION create_equipment_maintenance_record(p_maintenance_data jsonb)
RETURNS uuid AS $$
DECLARE
    new_maintenance_id uuid;
BEGIN
    INSERT INTO equipment_maintenance_history (equipment_id, maintenance_date, notes)
    VALUES (
        (p_maintenance_data->>'equipment_id')::uuid,
        (p_maintenance_data->>'maintenance_date')::date,
        p_maintenance_data->>'notes'
    ) RETURNING id INTO new_maintenance_id;
    RETURN new_maintenance_id;
END;
$$ LANGUAGE plpgsql;
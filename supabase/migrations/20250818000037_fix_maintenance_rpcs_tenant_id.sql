-- Fix create_equipment_maintenance_record to include tenant_id
CREATE OR REPLACE FUNCTION create_equipment_maintenance_record(
    p_tenant_id uuid,
    p_maintenance_data jsonb
)
RETURNS uuid AS $$
DECLARE
    new_maintenance_id uuid;
BEGIN
    INSERT INTO equipment_maintenance_history (equipment_id, maintenance_date, notes, tenant_id)
    VALUES (
        (p_maintenance_data->>'equipment_id')::uuid,
        (p_maintenance_data->>'maintenance_date')::date,
        p_maintenance_data->>'notes',
        p_tenant_id
    ) RETURNING id INTO new_maintenance_id;
    RETURN new_maintenance_id;
END;
$$ LANGUAGE plpgsql;

-- Fix update_equipment_maintenance_record to include tenant_id in WHERE clause
CREATE OR REPLACE FUNCTION update_equipment_maintenance_record(
    p_tenant_id uuid,
    p_record_id uuid,
    p_updates jsonb
)
RETURNS void AS $$
BEGIN
    UPDATE equipment_maintenance_history
    SET
        maintenance_date = COALESCE(NULLIF(p_updates->>'maintenance_date', '')::date, maintenance_date),
        notes = COALESCE(p_updates->>'notes', notes),
        updated_at = now()
    WHERE
        id = p_record_id AND tenant_id = p_tenant_id;
END;
$$ LANGUAGE plpgsql;

-- Fix delete_equipment_maintenance_record to include tenant_id in WHERE clause
DROP FUNCTION IF EXISTS delete_equipment_maintenance_record(uuid);
CREATE OR REPLACE FUNCTION delete_equipment_maintenance_record(
    p_tenant_id uuid,
    p_record_id uuid
)
RETURNS void AS $$
BEGIN
    DELETE FROM equipment_maintenance_history
    WHERE id = p_record_id AND tenant_id = p_tenant_id;
END;
$$ LANGUAGE plpgsql;
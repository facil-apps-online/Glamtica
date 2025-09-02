-- Make update_equipment robust for partial updates
DROP FUNCTION IF EXISTS update_equipment(uuid, jsonb);
CREATE OR REPLACE FUNCTION update_equipment(p_equipment_id uuid, p_equipment_data jsonb)
RETURNS void AS $$
BEGIN
    UPDATE equipment
    SET
        name = COALESCE(p_equipment_data->>'name', name),
        type_id = COALESCE(NULLIF(p_equipment_data->>'type_id', '')::uuid, type_id),
        brand_id = COALESCE(NULLIF(p_equipment_data->>'brand_id', '')::uuid, brand_id),
        model = COALESCE(p_equipment_data->>'model', model),
        serial_number = COALESCE(p_equipment_data->>'serial_number', serial_number),
        purchase_date = COALESCE(NULLIF(p_equipment_data->>'purchase_date', '')::date, purchase_date),
        last_maintenance_date = COALESCE(NULLIF(p_equipment_data->>'last_maintenance_date', '')::date, last_maintenance_date),
        maintenance_frequency = COALESCE((p_equipment_data->>'maintenance_frequency')::integer, maintenance_frequency),
        maintenance_frequency_unit = COALESCE(p_equipment_data->>'maintenance_frequency_unit', maintenance_frequency_unit),
        notes = COALESCE(p_equipment_data->>'notes', notes),
        is_active = COALESCE((p_equipment_data->>'is_active')::boolean, is_active),
        updated_at = now()
    WHERE
        id = p_equipment_id;
END;
$$ LANGUAGE plpgsql;
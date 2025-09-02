-- Function to update an equipment maintenance record
CREATE OR REPLACE FUNCTION update_equipment_maintenance_record(
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
        id = p_record_id;
END;
$$ LANGUAGE plpgsql;

-- Function to delete an equipment maintenance record
CREATE OR REPLACE FUNCTION delete_equipment_maintenance_record(
    p_record_id uuid
)
RETURNS void AS $$
BEGIN
    DELETE FROM equipment_maintenance_history
    WHERE id = p_record_id;
END;
$$ LANGUAGE plpgsql;
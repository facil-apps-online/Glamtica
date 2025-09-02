-- Fix update_equipment_maintenance_record by removing updated_at
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
        notes = COALESCE(p_updates->>'notes', notes)
        -- Removed updated_at = now()
    WHERE
        id = p_record_id AND tenant_id = p_tenant_id;
END;
$$ LANGUAGE plpgsql;
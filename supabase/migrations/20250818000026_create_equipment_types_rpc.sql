-- RPC functions for equipment_types

-- Function to get equipment types
CREATE OR REPLACE FUNCTION get_equipment_types(p_tenant_id uuid)
RETURNS TABLE(id uuid, name text, description text, is_active boolean) AS $$
BEGIN
    RETURN QUERY
    SELECT et.id, et.name, et.description, et.is_active
    FROM equipment_types et
    WHERE et.tenant_id = p_tenant_id
    ORDER BY et.name;
END;
$$ LANGUAGE plpgsql;

-- Function to create an equipment type
CREATE OR REPLACE FUNCTION create_equipment_type(p_tenant_id uuid, p_name text, p_description text)
RETURNS uuid AS $$
DECLARE
    new_type_id uuid;
BEGIN
    INSERT INTO equipment_types (tenant_id, name, description)
    VALUES (p_tenant_id, p_name, p_description)
    RETURNING id INTO new_type_id;
    RETURN new_type_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update an equipment type
CREATE OR REPLACE FUNCTION update_equipment_type(p_tenant_id uuid, p_type_id uuid, p_name text, p_description text, p_is_active boolean)
RETURNS void AS $$
BEGIN
    UPDATE equipment_types
    SET
        name = p_name,
        description = p_description,
        is_active = p_is_active,
        updated_at = now()
    WHERE id = p_type_id AND tenant_id = p_tenant_id;
END;
$$ LANGUAGE plpgsql;

-- Function to delete an equipment type
CREATE OR REPLACE FUNCTION delete_equipment_type(p_tenant_id uuid, p_type_id uuid)
RETURNS void AS $$
BEGIN
    -- Check if the type is being used by any equipment
    IF EXISTS (SELECT 1 FROM equipment WHERE type_id = p_type_id AND tenant_id = p_tenant_id) THEN
        RAISE EXCEPTION 'Cannot delete equipment type because it is in use.';
    END IF;

    DELETE FROM equipment_types WHERE id = p_type_id AND tenant_id = p_tenant_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_table_names()
RETURNS TABLE(table_name TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT t.table_name::text
    FROM information_schema.tables t
    WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE';
END;
$$ LANGUAGE plpgsql;
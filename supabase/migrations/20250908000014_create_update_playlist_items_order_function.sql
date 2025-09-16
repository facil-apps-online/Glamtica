CREATE OR REPLACE FUNCTION update_playlist_items_order(items_to_update jsonb)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    item_data jsonb;
BEGIN
    FOR item_data IN SELECT * FROM jsonb_array_elements(items_to_update)
    LOOP
        UPDATE public.playlist_items
        SET item_order = (item_data->>'item_order')::integer
        WHERE id = (item_data->>'id')::uuid;
    END LOOP;
END;
$$;

-- Funciones para gestionar las categorías de integración

-- 1. Obtener todas las categorías
CREATE OR REPLACE FUNCTION get_integration_categories()
RETURNS SETOF integration_categories
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
    -- La seguridad se maneja a nivel de RLS en la tabla.
    SELECT * FROM integration_categories ORDER BY name;
$$;

-- 2. Crear una nueva categoría
CREATE OR REPLACE FUNCTION create_integration_category(
    p_name TEXT,
    p_slug TEXT,
    p_description TEXT
)
RETURNS SETOF integration_categories
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
    -- La RLS de la tabla previene la inserción si el usuario no es superadmin.
    RETURN QUERY
    INSERT INTO integration_categories (name, slug, description)
    VALUES (p_name, p_slug, p_description)
    RETURNING *;
END;
$$;

-- 3. Actualizar una categoría existente
CREATE OR REPLACE FUNCTION update_integration_category(
    p_id UUID,
    p_name TEXT,
    p_slug TEXT,
    p_description TEXT
)
RETURNS SETOF integration_categories
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
    -- La RLS de la tabla previene la actualización si el usuario no es superadmin.
    RETURN QUERY
    UPDATE integration_categories
    SET
        name = p_name,
        slug = p_slug,
        description = p_description,
        updated_at = NOW()
    WHERE id = p_id
    RETURNING *;
END;
$$;

-- 4. Eliminar una categoría
CREATE OR REPLACE FUNCTION delete_integration_category(
    p_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
    -- Primero, se comprueba que la categoría no esté en uso.
    IF EXISTS (SELECT 1 FROM integration_providers WHERE category_id = p_id) THEN
        RAISE EXCEPTION 'No se puede eliminar la categoría porque está siendo utilizada por uno o más proveedores.';
    END IF;

    -- La RLS de la tabla previene la eliminación si el usuario no es superadmin.
    DELETE FROM integration_categories WHERE id = p_id;
END;
$$;

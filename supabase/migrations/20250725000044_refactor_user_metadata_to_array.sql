-- Fase 1: Refactorizar los metadatos del superadministrador a un array de asignaciones.
DO $$
DECLARE
    super_admin_user RECORD;
    current_metadata JSONB;
    new_metadata JSONB;
    assignment JSONB;
BEGIN
    -- 1. Encontrar al superadministrador existente (asumimos que solo hay uno por ahora).
    SELECT * INTO super_admin_user
    FROM auth.users
    WHERE raw_app_meta_data->>'role' = 'super_admin'
    LIMIT 1;

    -- 2. Si se encuentra un superadministrador y sus metadatos no han sido actualizados aún.
    IF FOUND AND jsonb_typeof(super_admin_user.raw_app_meta_data->'assignments') IS NULL THEN
        RAISE NOTICE 'Actualizando metadatos para el superadministrador: %', super_admin_user.email;

        -- 3. Extraer los metadatos actuales.
        current_metadata := super_admin_user.raw_app_meta_data;

        -- 4. Construir el nuevo objeto de asignación.
        assignment := jsonb_build_object(
            'assignment_id', gen_random_uuid(),
            'tenant_id', current_metadata->'tenant_id',
            'tenant_name', current_metadata->'tenant_name',
            'role_id', current_metadata->'role_id',
            'role', current_metadata->'role',
            'branch_id', NULL, -- No tenemos sucursal para el superadmin
            'status', 'active'
        );

        -- 5. Construir la nueva estructura completa de metadatos.
        new_metadata := jsonb_build_object(
            'assignments', jsonb_build_array(assignment)
        );

        -- 6. Actualizar el registro del usuario con los nuevos metadatos.
        UPDATE auth.users
        SET raw_app_meta_data = new_metadata
        WHERE id = super_admin_user.id;

        RAISE NOTICE 'Metadatos del superadministrador actualizados exitosamente.';
    ELSE
        RAISE NOTICE 'No se encontró un superadministrador para actualizar o ya está en el nuevo formato.';
    END IF;
END $$;
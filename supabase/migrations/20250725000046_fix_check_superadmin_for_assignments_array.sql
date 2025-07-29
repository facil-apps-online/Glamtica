-- Corrige la función check_superadmin_exists para que sea compatible
-- con la nueva estructura de metadatos basada en un array de "assignments".
CREATE OR REPLACE FUNCTION check_superadmin_exists()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users,
         jsonb_array_elements(raw_app_meta_data->'assignments') as assignment
    WHERE assignment->>'role' = 'super_admin'
  );
$$;

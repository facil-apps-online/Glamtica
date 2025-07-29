-- Corrige la lógica para verificar la existencia de un superadministrador.
-- La nueva función busca directamente en los metadatos del usuario,
-- que es la fuente de verdad actual.
CREATE OR REPLACE FUNCTION check_superadmin_exists()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users
    WHERE raw_app_meta_data->>'role' = 'super_admin'
  );
$$;

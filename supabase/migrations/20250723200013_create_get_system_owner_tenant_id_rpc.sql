-- Crea la función RPC para obtener el ID del tenant propietario del sistema.
CREATE OR REPLACE FUNCTION public.get_system_owner_tenant_id()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT id
  FROM public.tenants
  WHERE is_system_owner = true
  LIMIT 1;
$$;

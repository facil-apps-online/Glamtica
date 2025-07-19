-- 1. Limpiar la política de RLS creada anteriormente para el rol 'authenticated'.
DROP POLICY IF EXISTS "Allow authenticated users to insert metrics" ON public.api_request_metrics;

-- 2. Deshabilitar completamente RLS en la tabla de métricas para simplificar las inserciones desde las funciones.
ALTER TABLE public.api_request_metrics DISABLE ROW LEVEL SECURITY;

-- 3. Revocar el permiso de ejecución incorrecto al rol 'authenticated'.
REVOKE EXECUTE ON FUNCTION public.get_tenants_with_metrics(search_term_param TEXT) FROM authenticated;

-- 4. Conceder el permiso de ejecución correcto al rol 'anon', que es el que se usa con el JWT personalizado.
GRANT EXECUTE ON FUNCTION public.get_tenants_with_metrics(search_term_param TEXT) TO anon;

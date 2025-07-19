-- Deshabilitar RLS en la tabla de métricas.
ALTER TABLE public.api_request_metrics DISABLE ROW LEVEL SECURITY;

-- Conceder el permiso de ejecución al rol 'anon', que es el que se usa con el JWT personalizado.
GRANT EXECUTE ON FUNCTION public.get_tenants_with_metrics(search_term_param TEXT) TO anon;

-- 1. Habilitar la Seguridad a Nivel de Fila (RLS) en la tabla de métricas.
ALTER TABLE public.api_request_metrics ENABLE ROW LEVEL SECURITY;

-- 2. Crear una política que permita a los usuarios autenticados insertar registros.
-- No se otorgan permisos de lectura, actualización o borrado, solo inserción.
CREATE POLICY "Allow authenticated users to insert metrics"
ON public.api_request_metrics
FOR INSERT
TO authenticated
WITH CHECK (true);

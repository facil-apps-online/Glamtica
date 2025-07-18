-- Este script elimina de forma segura la función RPC existente para preparar su recreación.
DROP FUNCTION IF EXISTS public.get_tenants_with_metrics(TEXT);

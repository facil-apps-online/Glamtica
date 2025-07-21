-- Esta migración ajusta los permisos de las nuevas tablas de integraciones
-- para alinearse con el patrón de seguridad existente en el proyecto,
-- que utiliza GRANT en lugar de RLS para estas tablas de configuración.

-- 1. Deshabilitar Row Level Security para ambas tablas
ALTER TABLE public.integration_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_providers DISABLE ROW LEVEL SECURITY;

-- 2. Eliminar las políticas RLS previamente creadas para evitar conflictos
DROP POLICY IF EXISTS "Superadmins can manage integration categories" ON public.integration_categories;
DROP POLICY IF EXISTS "Superadmins can manage integration providers" ON public.integration_providers;

-- 3. Conceder todos los permisos al rol 'public'
GRANT ALL ON TABLE public.integration_categories TO public;
GRANT ALL ON TABLE public.integration_providers TO public;
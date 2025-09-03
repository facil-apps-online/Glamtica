-- Desactivar RLS temporalmente para evitar problemas de permisos al aplicar la migración
ALTER TABLE public.tenants DISABLE ROW LEVEL SECURITY;

-- Eliminar la política de SELECT existente. 
-- NOTA: El nombre 'Allow read access to everyone' es una suposición común. 
-- Si tu política tiene un nombre diferente, deberás ajustarlo aquí.
-- Se intenta eliminar varias políticas comunes para aumentar la probabilidad de éxito.
DROP POLICY IF EXISTS "Allow public read access" ON public.tenants;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.tenants;
DROP POLICY IF EXISTS "Allow individual read access" ON public.tenants;
DROP POLICY IF EXISTS "Public tenants are viewable by everyone." ON public.tenants;


-- Crear la nueva política de SELECT robusta
CREATE POLICY "Allow read access based on user assignment"
ON public.tenants
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.user_assignments
    WHERE
      user_assignments.tenant_id = tenants.id AND
      user_assignments.user_id = auth.uid() AND
      user_assignments.status = 'active'
  )
);

-- Reactivar RLS en la tabla
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Forzar la replicación de RLS para la tabla
ALTER TABLE public.tenants FORCE ROW LEVEL SECURITY;

-- NOTA: Por ahora, solo se ha modificado la política de SELECT.
-- Las políticas de INSERT, UPDATE y DELETE no se han añadido para evitar
-- comportamientos inesperados. Si son necesarias, se pueden añadir después
-- con la lógica de permisos adecuada (ej. solo un 'tenant_admin' puede actualizar).

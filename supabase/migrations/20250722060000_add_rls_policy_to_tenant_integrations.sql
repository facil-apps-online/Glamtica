-- Migración para añadir la política de RLS correcta a tenant_integrations para superadministradores.

-- Habilitar RLS en la tabla por si acaso.
ALTER TABLE public.tenant_integrations ENABLE ROW LEVEL SECURITY;

-- Eliminar cualquier política antigua para evitar conflictos.
DROP POLICY IF EXISTS "Superadmins can manage all tenant integrations" ON public.tenant_integrations;

-- Crear la política definitiva que usa la función personalizada get_current_role_name()
CREATE POLICY "Superadmins can manage all tenant integrations"
ON public.tenant_integrations
FOR ALL -- Permite SELECT, INSERT, UPDATE, DELETE
TO authenticated
USING (
  public.get_current_role_name() = 'super_admin'
)
WITH CHECK (
  public.get_current_role_name() = 'super_admin'
);

COMMENT ON POLICY "Superadmins can manage all tenant integrations" ON public.tenant_integrations 
IS 'Otorga a los superadministradores permisos completos para gestionar las integraciones de los tenants, usando el rol del JWT personalizado.';

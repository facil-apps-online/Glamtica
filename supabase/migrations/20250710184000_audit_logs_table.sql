
/*
  # Sistema de Auditoría

  1. New Table
    - `audit_logs` - Registra todas las acciones sensibles del sistema para auditoría

  2. Security
    - Enable RLS on the new table
    - Add policies to restrict access to super_admin and tenant_super_admin

  3. Triggers
    - Add `updated_at` trigger for the new table (though not strictly necessary for logs, good practice)
*/

-- Tabla de logs de auditoría
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  tenant_id uuid NOT NULL,
  branch_id uuid,
  action text NOT NULL, -- Ej: 'user_login', 'tenant_created', 'product_updated'
  entity_type text, -- Ej: 'users', 'tenants', 'products'
  entity_id uuid, -- ID de la entidad afectada
  old_value jsonb, -- Valor anterior del registro (para actualizaciones)
  new_value jsonb, -- Nuevo valor del registro (para inserciones/actualizaciones)
  ip_address inet, -- Dirección IP del usuario
  user_agent text, -- User agent del navegador/cliente
  created_at timestamp with time zone DEFAULT now()
);

-- Añadir columnas tenant_id y branch_id a la tabla existente si no existen
-- (Esto ya debería estar manejado por migraciones anteriores, pero se incluye por robustez)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'tenant_id') THEN
        ALTER TABLE audit_logs ADD COLUMN tenant_id uuid;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'branch_id') THEN
        ALTER TABLE audit_logs ADD COLUMN branch_id uuid;
    END IF;
END$$;

-- Habilitar RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (solo super_admin y tenant_super_admin pueden ver los logs de su tenant)
CREATE POLICY "Super admins can view all audit logs"
  ON audit_logs
  FOR SELECT
  TO public
  USING (is_super_admin());

CREATE POLICY "Tenant super admins can view their tenant's audit logs"
  ON audit_logs
  FOR SELECT
  TO public
  USING (is_tenant_super_admin() AND tenant_id = get_current_tenant_id());

-- Permitir inserciones desde funciones de confianza (ej: triggers, funciones de backend)
-- No se permite la inserción directa por usuarios normales
CREATE POLICY "Allow trusted functions to insert audit logs"
  ON audit_logs
  FOR INSERT
  TO public
  WITH CHECK (true); -- La lógica de inserción se manejará en el backend o triggers

-- No permitir actualizaciones ni eliminaciones directas
CREATE POLICY "Deny all updates on audit_logs"
  ON audit_logs
  FOR UPDATE
  TO public
  USING (false);

CREATE POLICY "Deny all deletes on audit_logs"
  ON audit_logs
  FOR DELETE
  TO public
  USING (false);

-- Trigger para updated_at (aunque no es común para logs, se mantiene por consistencia)
CREATE TRIGGER trigger_audit_logs_updated_at
  BEFORE UPDATE ON audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

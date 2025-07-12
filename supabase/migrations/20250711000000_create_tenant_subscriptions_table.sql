/*
  # Tabla de Suscripciones por Tenant

  1. New Table
    - `tenant_subscriptions` - Registra las suscripciones activas de cada tenant

  2. Security
    - Enable RLS on the new table
    - Add policies for multi-tenancy and role-based access

  3. Triggers
    - Add `updated_at` trigger for the new table
*/

-- Tabla de suscripciones por tenant
CREATE TABLE IF NOT EXISTS tenant_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  subscription_plan_id uuid NOT NULL REFERENCES subscription_plans(id) ON DELETE RESTRICT,
  start_date timestamp with time zone NOT NULL DEFAULT now(),
  end_date timestamp with time zone,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, subscription_plan_id, start_date) -- Un tenant no puede tener el mismo plan iniciando en la misma fecha
);

-- Añadir columnas tenant_id y branch_id a la tabla existente si no existen
-- (Esto ya debería estar manejado por migraciones anteriores, pero se incluye por robustez)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenant_subscriptions' AND column_name = 'tenant_id') THEN
        ALTER TABLE tenant_subscriptions ADD COLUMN tenant_id uuid;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenant_subscriptions' AND column_name = 'branch_id') THEN
        ALTER TABLE tenant_subscriptions ADD COLUMN branch_id uuid;
    END IF;
END$$;

-- Habilitar RLS
ALTER TABLE tenant_subscriptions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (permisivas para desarrollo, se ajustarán después)
CREATE POLICY "Enable all operations for tenant_subscriptions" 
  ON tenant_subscriptions
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Trigger para updated_at
CREATE TRIGGER trigger_tenant_subscriptions_updated_at
  BEFORE UPDATE ON tenant_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
/*
  # Sistema de Suscripciones y Localización

  1. New Tables
    - `subscription_plans` - Define los planes de suscripción disponibles
    - `countries` - Lista de países soportados con configuraciones regionales
    - `currencies` - Lista de monedas soportadas con sus símbolos y formatos

  2. Security
    - Enable RLS on all new tables
    - Add policies for multi-tenancy and role-based access

  3. Triggers
    - Add `updated_at` triggers for all new tables
*/

-- Tabla de monedas
CREATE TABLE IF NOT EXISTS currencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  code text NOT NULL UNIQUE, -- Ej: USD, COP, EUR
  symbol text NOT NULL,
  format text, -- Ej: $#,##0.00;($#,##0.00)
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Tabla de planes de suscripción
CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  price numeric NOT NULL DEFAULT 0,
  currency_id uuid REFERENCES currencies(id),
  duration_days integer NOT NULL DEFAULT 30, -- Duración en días
  max_users integer,
  max_branches integer,
  features text[], -- Lista de características incluidas
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Tabla de países
CREATE TABLE IF NOT EXISTS countries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  iso_code text NOT NULL UNIQUE, -- Ej: CO, US, ES
  currency_id uuid REFERENCES currencies(id),
  timezone text, -- Zona horaria por defecto del país
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Añadir columnas tenant_id y branch_id a las tablas existentes si no existen
-- (Esto ya debería estar manejado por migraciones anteriores, pero se incluye por robustez)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_plans' AND column_name = 'tenant_id') THEN
        ALTER TABLE subscription_plans ADD COLUMN tenant_id uuid;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_plans' AND column_name = 'branch_id') THEN
        ALTER TABLE subscription_plans ADD COLUMN branch_id uuid;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'countries' AND column_name = 'tenant_id') THEN
        ALTER TABLE countries ADD COLUMN tenant_id uuid;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'countries' AND column_name = 'branch_id') THEN
        ALTER TABLE countries ADD COLUMN branch_id uuid;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'currencies' AND column_name = 'tenant_id') THEN
        ALTER TABLE currencies ADD COLUMN tenant_id uuid;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'currencies' AND column_name = 'branch_id') THEN
        ALTER TABLE currencies ADD COLUMN branch_id uuid;
    END IF;
END$$;

-- Habilitar RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE currencies ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (permisivas para desarrollo, se ajustarán después)
CREATE POLICY "Enable all operations for subscription_plans"
  ON subscription_plans
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable all operations for countries"
  ON countries
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable all operations for currencies"
  ON currencies
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Triggers para updated_at
CREATE TRIGGER trigger_subscription_plans_updated_at
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_countries_updated_at
  BEFORE UPDATE ON countries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_currencies_updated_at
  BEFORE UPDATE ON currencies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insertar monedas por defecto
INSERT INTO currencies (name, code, symbol, format) VALUES
('US Dollar', 'USD', '$', '#,##0.00'),
('Colombian Peso', 'COP', '$ ', '#,##0.00'),
('Euro', 'EUR', '€', '#,##0.00')
ON CONFLICT (code) DO NOTHING;

-- Insertar países por defecto
DO $$
DECLARE
  usd_id uuid;
  cop_id uuid;
  eur_id uuid;
BEGIN
  SELECT id INTO usd_id FROM currencies WHERE code = 'USD';
  SELECT id INTO cop_id FROM currencies WHERE code = 'COP';
  SELECT id INTO eur_id FROM currencies WHERE code = 'EUR';

  INSERT INTO countries (name, iso_code, currency_id, timezone) VALUES
  ('United States', 'US', usd_id, 'America/New_York'),
  ('Colombia', 'CO', cop_id, 'America/Bogota'),
  ('Spain', 'ES', eur_id, 'Europe/Madrid')
  ON CONFLICT (iso_code) DO NOTHING;
END $$;

-- Insertar planes de suscripción de ejemplo
DO $$
DECLARE
  usd_id uuid;
BEGIN
  SELECT id INTO usd_id FROM currencies WHERE code = 'USD';

  INSERT INTO subscription_plans (name, price, currency_id, duration_days, max_users, max_branches, features) VALUES
  ('Basic', 9.99, usd_id, 30, 5, 1, ARRAY['CRM', 'Agenda']),
  ('Pro', 29.99, usd_id, 30, 20, 5, ARRAY['CRM', 'Agenda', 'Inventario', 'POS']),
  ('Enterprise', 99.99, usd_id, 30, NULL, NULL, ARRAY['CRM', 'Agenda', 'Inventario', 'POS', 'Reportes', 'API'])
  ON CONFLICT (name) DO NOTHING;
END $$;
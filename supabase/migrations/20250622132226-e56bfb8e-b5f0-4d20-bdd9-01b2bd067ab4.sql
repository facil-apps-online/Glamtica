
-- Agregar configuraciones para métodos de costeo
INSERT INTO settings (key, value, description) VALUES 
('costing_method', 'average', 'Método de costeo: average (promedio) o last_purchase (última compra)')
ON CONFLICT (key) DO NOTHING;

INSERT INTO settings (key, value, description) VALUES 
('decimal_places', '2', 'Cantidad de decimales para mostrar en precios')
ON CONFLICT (key) DO NOTHING;

INSERT INTO settings (key, value, description) VALUES 
('currency_position', 'before', 'Posición del símbolo de moneda: before (antes) o after (después)')
ON CONFLICT (key) DO NOTHING;

-- Agregar campos de costo a productos
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS cost_price numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_purchase_cost numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS average_cost numeric DEFAULT 0;

-- Crear tabla de compras
CREATE TABLE IF NOT EXISTS purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_name text NOT NULL,
  purchase_date date NOT NULL DEFAULT CURRENT_DATE,
  invoice_number text,
  total_amount numeric NOT NULL DEFAULT 0,
  notes text,
  status text DEFAULT 'Completada' CHECK (status IN ('Pendiente', 'Completada', 'Cancelada')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Crear tabla de detalles de compras
CREATE TABLE IF NOT EXISTS purchase_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id uuid NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  unit_cost numeric NOT NULL,
  total_cost numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Agregar trigger para calcular total_cost en purchase_items
CREATE OR REPLACE FUNCTION calculate_purchase_item_total()
RETURNS trigger AS $$
BEGIN
  NEW.total_cost = NEW.quantity * NEW.unit_cost;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_purchase_item_total
  BEFORE INSERT OR UPDATE ON purchase_items
  FOR EACH ROW
  EXECUTE FUNCTION calculate_purchase_item_total();

-- Agregar trigger para actualizar updated_at en purchases
CREATE TRIGGER trigger_update_purchases_updated_at
  BEFORE UPDATE ON purchases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Agregar trigger para actualizar updated_at en purchase_items
CREATE TRIGGER trigger_update_purchase_items_updated_at
  BEFORE UPDATE ON purchase_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

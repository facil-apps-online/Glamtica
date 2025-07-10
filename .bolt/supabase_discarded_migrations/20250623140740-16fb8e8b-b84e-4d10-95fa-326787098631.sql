
-- Crear tabla de marcas
CREATE TABLE IF NOT EXISTS brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Agregar campos adicionales a productos
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS brand_id uuid REFERENCES brands(id),
ADD COLUMN IF NOT EXISTS min_stock integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_stock integer DEFAULT 100,
ADD COLUMN IF NOT EXISTS barcode text,
ADD COLUMN IF NOT EXISTS sku text;

-- Crear tabla de comisiones de productos por estilista
CREATE TABLE IF NOT EXISTS product_stylist_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  stylist_id uuid NOT NULL REFERENCES stylists(id) ON DELETE CASCADE,
  commission_rate numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(product_id, stylist_id)
);

-- Agregar trigger para actualizar updated_at en brands
CREATE TRIGGER trigger_update_brands_updated_at
  BEFORE UPDATE ON brands
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Agregar trigger para actualizar updated_at en product_stylist_commissions
CREATE TRIGGER trigger_update_product_stylist_commissions_updated_at
  BEFORE UPDATE ON product_stylist_commissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insertar algunas marcas por defecto
INSERT INTO brands (name, description) VALUES 
('L''Oréal', 'Productos profesionales L''Oréal'),
('Matrix', 'Línea profesional Matrix'),
('Redken', 'Productos premium Redken'),
('Schwarzkopf', 'Marca alemana de productos capilares'),
('Wella', 'Productos profesionales Wella'),
('Kerastase', 'Línea premium de cuidado capilar')
ON CONFLICT (name) DO NOTHING;

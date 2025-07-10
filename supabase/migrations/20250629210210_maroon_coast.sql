/*
  # Sistema de Proveedores, Comisiones y Gestión Avanzada

  1. New Tables
    - `suppliers` - Gestión de proveedores con identificación y contacto
    - `supplier_products` - Relación productos-proveedores con precios específicos
    - `service_stylist_commissions` - Comisiones específicas por servicio y estilista

  2. Security
    - Enable RLS where appropriate
    - Add proper constraints and validations

  3. Functions
    - Automatic product cost updates based on purchase method
    - Trigger system for inventory management
*/

-- Crear tabla de proveedores
CREATE TABLE IF NOT EXISTS suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identification_type text NOT NULL CHECK (identification_type IN ('NIT', 'CC', 'CE', 'Pasaporte')),
  identification_number text NOT NULL UNIQUE,
  name text NOT NULL,
  address text,
  phone text,
  email text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Crear tabla de productos por proveedor
CREATE TABLE IF NOT EXISTS supplier_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  supplier_price numeric NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(supplier_id, product_id)
);

-- Crear tabla de comisiones de servicios por estilista
CREATE TABLE IF NOT EXISTS service_stylist_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  stylist_id uuid NOT NULL REFERENCES stylists(id) ON DELETE CASCADE,
  commission_rate numeric NOT NULL DEFAULT 0,
  can_perform boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(service_id, stylist_id)
);

-- Agregar referencia a proveedor en tabla de compras
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'purchases' AND column_name = 'supplier_id'
  ) THEN
    ALTER TABLE purchases ADD COLUMN supplier_id uuid REFERENCES suppliers(id);
  END IF;
END $$;

-- Crear o reemplazar triggers para updated_at (evitar duplicados)
DO $$
BEGIN
  -- Drop existing triggers if they exist
  DROP TRIGGER IF EXISTS trigger_update_suppliers_updated_at ON suppliers;
  DROP TRIGGER IF EXISTS trigger_update_supplier_products_updated_at ON supplier_products;
  DROP TRIGGER IF EXISTS trigger_update_service_stylist_commissions_updated_at ON service_stylist_commissions;
  DROP TRIGGER IF EXISTS trigger_update_product_costs_after_purchase ON purchase_items;
  
  -- Create new triggers
  CREATE TRIGGER trigger_update_suppliers_updated_at
    BEFORE UPDATE ON suppliers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

  CREATE TRIGGER trigger_update_supplier_products_updated_at
    BEFORE UPDATE ON supplier_products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

  CREATE TRIGGER trigger_update_service_stylist_commissions_updated_at
    BEFORE UPDATE ON service_stylist_commissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
END $$;

-- Crear función para actualizar costos de productos después de compras
CREATE OR REPLACE FUNCTION update_product_costs()
RETURNS trigger AS $$
DECLARE
  costing_method text;
  current_avg_cost numeric;
  current_stock integer;
  new_avg_cost numeric;
BEGIN
  -- Obtener método de costeo de configuración
  SELECT value INTO costing_method 
  FROM settings 
  WHERE key = 'costing_method';
  
  -- Si no hay configuración, usar promedio por defecto
  IF costing_method IS NULL THEN
    costing_method := 'average';
  END IF;
  
  -- Obtener stock y costo promedio actual
  SELECT COALESCE(stock_quantity, 0), COALESCE(average_cost, 0)
  INTO current_stock, current_avg_cost
  FROM products 
  WHERE id = NEW.product_id;
  
  -- Actualizar stock y último costo de compra
  UPDATE products 
  SET stock_quantity = COALESCE(stock_quantity, 0) + NEW.quantity,
      last_purchase_cost = NEW.unit_cost
  WHERE id = NEW.product_id;
  
  -- Calcular y actualizar costo promedio
  IF costing_method = 'average' THEN
    IF current_stock = 0 OR current_avg_cost = 0 THEN
      new_avg_cost := NEW.unit_cost;
    ELSE
      new_avg_cost := ((current_avg_cost * current_stock) + (NEW.unit_cost * NEW.quantity)) / (current_stock + NEW.quantity);
    END IF;
    
    UPDATE products 
    SET average_cost = new_avg_cost,
        cost_price = new_avg_cost
    WHERE id = NEW.product_id;
  ELSIF costing_method = 'last_purchase' THEN
    UPDATE products 
    SET cost_price = NEW.unit_cost,
        average_cost = NEW.unit_cost
    WHERE id = NEW.product_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para actualizar costos después de insertar items de compra
DO $$
BEGIN
  DROP TRIGGER IF EXISTS trigger_update_product_costs_after_purchase ON purchase_items;
  
  CREATE TRIGGER trigger_update_product_costs_after_purchase
    AFTER INSERT ON purchase_items
    FOR EACH ROW
    EXECUTE FUNCTION update_product_costs();
END $$;

-- Insertar algunos proveedores de ejemplo
INSERT INTO suppliers (identification_type, identification_number, name, address, phone, email) VALUES 
('NIT', '900123456-7', 'Distribuidora Beauty Pro', 'Av. Caracas #45-67', '+57 1 234-5678', 'ventas@beautypro.com'),
('NIT', '800987654-3', 'Cosméticos Profesionales SAS', 'Calle 26 #68-45', '+57 1 876-5432', 'contacto@cosmepro.com'),
('CC', '12345678', 'María García - Importadora', 'Carrera 15 #23-45', '+57 300 123-4567', 'maria.garcia@email.com')
ON CONFLICT (identification_number) DO NOTHING;
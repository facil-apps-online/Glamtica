-- Crear tabla para productos vendidos por servicio específico
CREATE TABLE IF NOT EXISTS public.attention_service_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  attention_id UUID NOT NULL,
  attention_service_id UUID NOT NULL,
  product_id UUID NOT NULL,
  stylist_id UUID NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL,
  commission_rate NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.attention_service_products ENABLE ROW LEVEL SECURITY;

-- Create policy for full access
DROP POLICY IF EXISTS "Enable all operations for attention_service_products" ON public.attention_service_products;
CREATE POLICY "Enable all operations for attention_service_products"
ON public.attention_service_products
FOR ALL
TO authenticated
USING (true);

-- Add foreign key constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'attention_service_products_attention_id_fkey'
  ) THEN
    ALTER TABLE public.attention_service_products
    ADD CONSTRAINT attention_service_products_attention_id_fkey
    FOREIGN KEY (attention_id) REFERENCES public.attentions(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'attention_service_products_attention_service_id_fkey'
  ) THEN
    ALTER TABLE public.attention_service_products
    ADD CONSTRAINT attention_service_products_attention_service_id_fkey
    FOREIGN KEY (attention_service_id) REFERENCES public.attention_services(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'attention_service_products_product_id_fkey'
  ) THEN
    ALTER TABLE public.attention_service_products
    ADD CONSTRAINT attention_service_products_product_id_fkey
    FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'attention_service_products_stylist_id_fkey'
  ) THEN
    ALTER TABLE public.attention_service_products
    ADD CONSTRAINT attention_service_products_stylist_id_fkey
    FOREIGN KEY (stylist_id) REFERENCES public.stylists(id) ON DELETE RESTRICT;
  END IF;
END $$;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_attention_service_products_updated_at ON public.attention_service_products;
CREATE TRIGGER update_attention_service_products_updated_at
BEFORE UPDATE ON public.attention_service_products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger to calculate total_price automatically
CREATE OR REPLACE FUNCTION public.calculate_service_product_total()
RETURNS TRIGGER AS $$
BEGIN
  NEW.total_price = NEW.quantity * NEW.unit_price;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS calculate_service_product_total_trigger ON public.attention_service_products;
CREATE TRIGGER calculate_service_product_total_trigger
BEFORE INSERT OR UPDATE ON public.attention_service_products
FOR EACH ROW
EXECUTE FUNCTION public.calculate_service_product_total();
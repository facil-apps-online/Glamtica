-- Migration: 20250802000041_create_product_tax_types_table.sql
-- Description: Crea la tabla intermedia `product_tax_types` para la relación muchos a muchos entre productos y tipos de impuestos.

-- Crear la tabla product_tax_types
CREATE TABLE public.product_tax_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    tax_type_id UUID NOT NULL REFERENCES public.tax_types(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_product_tax_type UNIQUE (product_id, tax_type_id)
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.product_tax_types ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
-- Permitir a los usuarios leer sus propias relaciones producto-impuesto
CREATE POLICY "Tenants can view their own product tax types"
ON public.product_tax_types FOR SELECT
USING (tenant_id = (select auth.jwt() ->> 'tenant_id')::uuid);

-- Permitir a los usuarios insertar sus propias relaciones producto-impuesto
CREATE POLICY "Tenants can insert their own product tax types"
ON public.product_tax_types FOR INSERT
WITH CHECK (tenant_id = (select auth.jwt() ->> 'tenant_id')::uuid);

-- Permitir a los usuarios actualizar sus propias relaciones producto-impuesto
CREATE POLICY "Tenants can update their own product tax types"
ON public.product_tax_types FOR UPDATE
USING (tenant_id = (select auth.jwt() ->> 'tenant_id')::uuid);

-- Permitir a los usuarios eliminar sus propias relaciones producto-impuesto
CREATE POLICY "Tenants can delete their own product tax types"
ON public.product_tax_types FOR DELETE
USING (tenant_id = (select auth.jwt() ->> 'tenant_id')::uuid);

-- Triggers para created_at y updated_at
CREATE TRIGGER set_product_tax_types_timestamp
BEFORE UPDATE ON public.product_tax_types
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();



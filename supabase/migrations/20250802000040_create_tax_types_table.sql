-- Migration: 20250802000040_create_tax_types_table.sql
-- Description: Crea la tabla `tax_types` para la parametrización de impuestos de venta.

-- Crear la tabla tax_types
CREATE TABLE public.tax_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    rate NUMERIC(5, 4), -- Por ejemplo, 0.19 para 19%
    is_percentage BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_tax_type_name_per_tenant UNIQUE (tenant_id, name)
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.tax_types ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
-- Permitir a los usuarios leer sus propios tipos de impuestos
CREATE POLICY "Tenants can view their own tax types"
ON public.tax_types FOR SELECT
USING (tenant_id = (select auth.jwt() ->> 'tenant_id')::uuid);

-- Permitir a los usuarios insertar sus propios tipos de impuestos
CREATE POLICY "Tenants can insert their own tax types"
ON public.tax_types FOR INSERT
WITH CHECK (tenant_id = (select auth.jwt() ->> 'tenant_id')::uuid);

-- Permitir a los usuarios actualizar sus propios tipos de impuestos
CREATE POLICY "Tenants can update their own tax types"
ON public.tax_types FOR UPDATE
USING (tenant_id = (select auth.jwt() ->> 'tenant_id')::uuid);

-- Permitir a los usuarios eliminar sus propios tipos de impuestos
CREATE POLICY "Tenants can delete their own tax types"
ON public.tax_types FOR DELETE
USING (tenant_id = (select auth.jwt() ->> 'tenant_id')::uuid);

-- Triggers para created_at y updated_at
CREATE TRIGGER set_tax_types_timestamp
BEFORE UPDATE ON public.tax_types
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();



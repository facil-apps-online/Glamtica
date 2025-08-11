-- Migration: 20250802000042_create_service_tax_types_table.sql
-- Description: Crea la tabla intermedia `service_tax_types` para la relación muchos a muchos entre servicios y tipos de impuestos.

-- Crear la tabla service_tax_types
CREATE TABLE public.service_tax_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    tax_type_id UUID NOT NULL REFERENCES public.tax_types(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTamPTZ DEFAULT now(),
    CONSTRAINT unique_service_tax_type UNIQUE (service_id, tax_type_id)
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.service_tax_types ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
-- Permitir a los usuarios leer sus propias relaciones servicio-impuesto
CREATE POLICY "Tenants can view their own service tax types"
ON public.service_tax_types FOR SELECT
USING (tenant_id = (select auth.jwt() ->> 'tenant_id')::uuid);

-- Permitir a los usuarios insertar sus propias relaciones servicio-impuesto
CREATE POLICY "Tenants can insert their own service tax types"
ON public.service_tax_types FOR INSERT
WITH CHECK (tenant_id = (select auth.jwt() ->> 'tenant_id')::uuid);

-- Permitir a los usuarios actualizar sus propias relaciones servicio-impuesto
CREATE POLICY "Tenants can update their own service tax types"
ON public.service_tax_types FOR UPDATE
USING (tenant_id = (select auth.jwt() ->> 'tenant_id')::uuid);

-- Permitir a los usuarios eliminar sus propias relaciones servicio-impuesto
CREATE POLICY "Tenants can delete their own service tax types"
ON public.service_tax_types FOR DELETE
USING (tenant_id = (select auth.jwt() ->> 'tenant_id')::uuid);

-- Triggers para created_at y updated_at
CREATE TRIGGER set_service_tax_types_timestamp
BEFORE UPDATE ON public.service_tax_types
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();



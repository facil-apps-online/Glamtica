-- Add indexes to equipment_brands table for performance
CREATE INDEX idx_equipment_brands_tenant_id ON public.equipment_brands (tenant_id);
CREATE INDEX idx_equipment_brands_tenant_id_name ON public.equipment_brands (tenant_id, name);
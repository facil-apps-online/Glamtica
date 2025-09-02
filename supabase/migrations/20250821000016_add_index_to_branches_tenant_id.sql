-- MIGRACIÓN PARA AÑADIR ÍNDICE A branches.tenant_id
-- Este índice mejorará significativamente el rendimiento de las consultas que filtran por tenant_id en la tabla branches,
-- incluyendo la función get_tenant_branches.

CREATE INDEX IF NOT EXISTS idx_branches_tenant_id ON public.branches (tenant_id);
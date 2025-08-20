-- Indexes for equipment table
CREATE INDEX IF NOT EXISTS idx_equipment_tenant_id ON public.equipment (tenant_id);
CREATE INDEX IF NOT EXISTS idx_equipment_type_id ON public.equipment (type_id);

-- Indexes for equipment_assignments table
-- For JOIN ON e.id = ea.equipment_id AND ea.return_date IS NULL
CREATE INDEX IF NOT EXISTS idx_equipment_assignments_equipment_id_return_date ON public.equipment_assignments (equipment_id, return_date);
-- For WHERE (p_branch_id IS NULL OR ea.branch_id = p_branch_id)
CREATE INDEX IF NOT EXISTS idx_equipment_assignments_branch_id ON public.equipment_assignments (branch_id);
-- For WHERE (p_user_id IS NULL OR ea.user_id = p_user_id)
CREATE INDEX IF NOT EXISTS idx_equipment_assignments_user_id ON public.equipment_assignments (user_id);
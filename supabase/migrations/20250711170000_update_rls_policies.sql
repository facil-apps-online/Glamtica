-- Update RLS policies for appointments and settings tables

-- Appointments table (tenant_id and branch_id)
DROP POLICY IF EXISTS "Enable all operations for appointments" ON public.appointments;
CREATE POLICY "appointments_rls_policy" ON public.appointments FOR ALL TO public USING (tenant_branch_rls_policy(tenant_id, branch_id));

-- Settings table (tenant_id only)
DROP POLICY IF EXISTS "Enable all operations for settings" ON public.settings;
CREATE POLICY "settings_rls_policy" ON public.settings FOR ALL TO public USING (tenant_only_rls_policy(tenant_id));
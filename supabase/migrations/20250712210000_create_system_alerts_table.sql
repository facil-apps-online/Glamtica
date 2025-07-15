
CREATE TABLE public.system_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.system_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.system_alerts FOR SELECT USING (true);
CREATE POLICY "Enable CRUD for super_admin" ON public.system_alerts FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());


CREATE TABLE public.performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name TEXT NOT NULL,
    metric_value NUMERIC NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for super_admin" ON public.performance_metrics FOR SELECT USING (public.is_super_admin());

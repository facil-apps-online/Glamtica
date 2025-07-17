
CREATE TABLE public.generic_taxes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    rate NUMERIC(5, 2) NOT NULL, -- e.g., 0.19 for 19%
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.generic_taxes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.generic_taxes FOR SELECT USING (true);
CREATE POLICY "Enable CRUD for super_admin" ON public.generic_taxes FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

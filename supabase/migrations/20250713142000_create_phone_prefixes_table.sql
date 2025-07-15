-- Crear la nueva tabla dedicada para los prefijos telefónicos
CREATE TABLE public.phone_prefixes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_name TEXT NOT NULL,
    iso_code VARCHAR(2) NOT NULL UNIQUE,
    prefix VARCHAR(10) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS para la nueva tabla
ALTER TABLE public.phone_prefixes ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso para la nueva tabla
CREATE POLICY "Allow public read access on phone_prefixes" ON public.phone_prefixes FOR SELECT USING (true);
CREATE POLICY "Allow all for super_admin on phone_prefixes" ON public.phone_prefixes FOR ALL
    USING ((auth.jwt() ->> 'role') = 'super_admin')
    WITH CHECK ((auth.jwt() ->> 'role') = 'super_admin');

-- Crear únicamente la tabla 'locales' y establecer sus relaciones
CREATE TABLE public.locales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    language_id UUID NOT NULL REFERENCES public.languages(id) ON DELETE CASCADE,
    country_id UUID NOT NULL REFERENCES public.countries(id) ON DELETE CASCADE,
    locale_code TEXT NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (language_id, country_id)
);

-- Habilitar RLS para la nueva tabla
ALTER TABLE public.locales ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso para la nueva tabla
CREATE POLICY "Allow public read access on locales" ON public.locales FOR SELECT USING (true);
CREATE POLICY "Allow all for super_admin on locales" ON public.locales FOR ALL
    USING ((auth.jwt() ->> 'user_role') = 'super_admin')
    WITH CHECK ((auth.jwt() ->> 'user_role') = 'super_admin');

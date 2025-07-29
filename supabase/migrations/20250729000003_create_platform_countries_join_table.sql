-- Tabla para vincular plataformas con los países en los que pueden operar.
CREATE TABLE public.platform_countries (
    platform_id UUID NOT NULL,
    country_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Constraints
    CONSTRAINT platform_countries_pkey PRIMARY KEY (platform_id, country_id),
    CONSTRAINT platform_countries_platform_id_fkey FOREIGN KEY (platform_id) REFERENCES public.platforms(id) ON DELETE CASCADE,
    CONSTRAINT platform_countries_country_id_fkey FOREIGN KEY (country_id) REFERENCES public.countries(id) ON DELETE CASCADE
);

-- Comentarios de la tabla y columnas
COMMENT ON TABLE public.platform_countries IS 'Tabla de enlace para definir qué países están disponibles para cada plataforma.';
COMMENT ON COLUMN public.platform_countries.platform_id IS 'Referencia a la plataforma.';
COMMENT ON COLUMN public.platform_countries.country_id IS 'Referencia al país disponible para la plataforma.';

-- Habilitar Row Level Security
ALTER TABLE public.platform_countries ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
CREATE POLICY "Super Admins have full access"
ON public.platform_countries
FOR ALL
USING ((SELECT (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'))
WITH CHECK ((SELECT (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'));

CREATE POLICY "Authenticated users can read available countries"
ON public.platform_countries
FOR SELECT
USING (auth.role() = 'authenticated');

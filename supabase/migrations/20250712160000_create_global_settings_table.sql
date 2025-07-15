
CREATE TABLE public.global_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT NOT NULL UNIQUE,
    setting_value TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO public.global_settings (setting_key, setting_value) VALUES
    ('base_currency_id', NULL); -- Will be updated with a valid currency ID later

ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.global_settings FOR SELECT USING (true);
CREATE POLICY "Enable update for super_admin" ON public.global_settings FOR UPDATE USING (public.is_super_admin());

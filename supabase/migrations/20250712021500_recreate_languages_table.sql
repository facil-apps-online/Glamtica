-- Drop and recreate languages table with iso_code as primary key

DROP TABLE IF EXISTS public.languages CASCADE;

CREATE TABLE IF NOT EXISTS public.languages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  iso_code TEXT NOT NULL UNIQUE, -- e.g., 'en', 'es', 'fr'
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS
ALTER TABLE public.languages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all operations for languages" ON public.languages FOR ALL USING (true) WITH CHECK (true);

-- Add updated_at trigger
CREATE TRIGGER trigger_languages_updated_at
  BEFORE UPDATE ON public.languages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default languages
INSERT INTO public.languages (name, iso_code) VALUES
('English', 'en'),
('Español', 'es')
ON CONFLICT (iso_code) DO NOTHING;

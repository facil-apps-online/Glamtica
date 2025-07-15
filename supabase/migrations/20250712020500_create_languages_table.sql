-- Create languages table
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

-- Drop policy if it exists before creating it to ensure idempotency
DROP POLICY IF EXISTS "Enable all operations for languages" ON public.languages;
CREATE POLICY "Enable all operations for languages" ON public.languages FOR ALL USING (true) WITH CHECK (true);

-- Drop trigger if it exists before creating it to ensure idempotency
DROP TRIGGER IF EXISTS trigger_languages_updated_at ON public.languages;
CREATE TRIGGER trigger_languages_updated_at
  BEFORE UPDATE ON public.languages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default languages
INSERT INTO public.languages (name, iso_code) VALUES
('English', 'en'),
('Español', 'es')
ON CONFLICT (iso_code) DO NOTHING;

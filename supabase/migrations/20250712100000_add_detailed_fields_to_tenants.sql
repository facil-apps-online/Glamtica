-- Add detailed fields to tenants table
ALTER TABLE public.tenants
ADD COLUMN contact_person TEXT,
ADD COLUMN contact_email TEXT,
ADD COLUMN contact_phone TEXT,
ADD COLUMN address TEXT,
ADD COLUMN city TEXT,
ADD COLUMN country_id UUID REFERENCES public.countries(id) ON DELETE SET NULL,
ADD COLUMN is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN logo_url TEXT,
ADD COLUMN notes TEXT;

-- Create index for country_id
CREATE INDEX idx_tenants_country_id ON public.tenants(country_id);

-- Update updated_at column on changes
CREATE TRIGGER update_tenants_updated_at
BEFORE UPDATE ON public.tenants
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

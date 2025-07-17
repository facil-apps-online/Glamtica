-- Add localization fields to tenants, branches, and users tables

ALTER TABLE public.tenants
ADD COLUMN IF NOT EXISTS default_language_code TEXT REFERENCES public.languages(iso_code) ON UPDATE CASCADE ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS default_currency_id UUID REFERENCES public.currencies(id) ON UPDATE CASCADE ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS default_timezone TEXT;

ALTER TABLE public.branches
ADD COLUMN IF NOT EXISTS language_code TEXT REFERENCES public.languages(iso_code) ON UPDATE CASCADE ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS currency_id UUID REFERENCES public.currencies(id) ON UPDATE CASCADE ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS timezone TEXT;

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS language_code TEXT REFERENCES public.languages(iso_code) ON UPDATE CASCADE ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS currency_id UUID REFERENCES public.currencies(id) ON UPDATE CASCADE ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS timezone TEXT;

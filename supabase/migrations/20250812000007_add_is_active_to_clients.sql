-- Add is_active column to public.clients
ALTER TABLE public.clients
ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- Update existing records to set is_active to TRUE
UPDATE public.clients
SET is_active = TRUE
WHERE is_active IS NULL;
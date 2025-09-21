ALTER TABLE public.plan_asset_limits
ADD COLUMN country_id UUID REFERENCES public.countries(id) ON DELETE CASCADE;

-- Update existing rows to a default country if necessary, for example, Colombia (CO).
-- Replace 'your_default_country_id' with the actual UUID of the default country.
-- UPDATE public.plan_asset_limits
-- SET country_id = 'your_default_country_id'
-- WHERE country_id IS NULL;

-- Once all rows are populated, you might want to enforce a NOT NULL constraint.
-- ALTER TABLE public.plan_asset_limits
-- ALTER COLUMN country_id SET NOT NULL;

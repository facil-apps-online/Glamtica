-- Drop existing constraints and indexes that depend on start_date/end_date
ALTER TABLE public.user_time_off DROP CONSTRAINT IF EXISTS stylist_time_off_check;
ALTER TABLE public.user_time_off DROP CONSTRAINT IF EXISTS stylist_time_off_check1;
DROP INDEX IF EXISTS public.idx_stylist_time_off_dates;

-- Drop start_time and end_time columns
ALTER TABLE public.user_time_off DROP COLUMN IF EXISTS start_time;
ALTER TABLE public.user_time_off DROP COLUMN IF EXISTS end_time;

-- Alter start_date and end_date columns to timestamptz
-- IMPORTANT: This assumes existing 'date' values represent midnight UTC.
-- If your dates are in a specific timezone and need conversion,
-- you'll need to adjust this part.
ALTER TABLE public.user_time_off ALTER COLUMN start_date TYPE timestamptz USING start_date::timestamptz;
ALTER TABLE public.user_time_off ALTER COLUMN end_date TYPE timestamptz USING end_date::timestamptz;

-- Add new check constraint for timestamptz
ALTER TABLE public.user_time_off ADD CONSTRAINT user_time_off_date_order_check CHECK (end_date >= start_date);

-- Recreate index with timestamptz columns
CREATE INDEX IF NOT EXISTS idx_user_time_off_dates ON public.user_time_off USING btree (start_date, end_date);

-- Update audit trigger function if it references specific columns
-- (Assuming audit_trigger_function is generic and handles column changes)
-- If not, you might need to recreate or modify it.
-- No changes needed for audit_user_time_off_changes or trigger_stylist_time_off_updated_at
-- as they are generic.

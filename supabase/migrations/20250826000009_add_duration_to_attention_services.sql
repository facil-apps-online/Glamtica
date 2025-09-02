-- Migration: Add duration_minutes to attention_services table
-- This migration adds the column and backfills it with data from the services table.

-- Step 1: Add the duration_minutes column if it doesn't exist.
ALTER TABLE public.attention_services
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;

-- Step 2: Backfill the new column with values from the services table.
-- This ensures existing records have the correct duration.
UPDATE public.attention_services AS aserv
SET duration_minutes = s.duration_minutes
FROM public.services AS s
WHERE aserv.service_id = s.id
  AND aserv.duration_minutes IS NULL; -- Only update rows where duration is not yet set

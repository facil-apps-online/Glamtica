-- Migration: Refactor attentions table to use a single TIMESTAMPTZ column (Highly Idempotent Version)

-- Step 1: Add the new nullable TIMESTAMPTZ column if it doesn't already exist.
ALTER TABLE public.attentions
ADD COLUMN IF NOT EXISTS attention_datetime TIMESTAMPTZ;

-- Step 2 & 3: Conditionally migrate data and set NOT NULL if the old columns exist.
DO $$
BEGIN
    -- Check if the old 'attention_date' column exists.
    IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='attentions' AND column_name='attention_date') THEN
        -- If it exists, then the data migration needs to run.
        RAISE NOTICE 'Old columns found. Migrating data to attention_datetime...';

        -- Update the new column by combining the old date and time columns.
        UPDATE public.attentions a
        SET attention_datetime = (a.attention_date + a.attention_time) AT TIME ZONE t.default_timezone
        FROM public.tenants t
        WHERE a.tenant_id = t.id AND a.attention_datetime IS NULL;

        -- Make the new column non-nullable now that it's populated.
        ALTER TABLE public.attentions
        ALTER COLUMN attention_datetime SET NOT NULL;

    ELSE
        RAISE NOTICE 'Old columns not found, skipping data migration.';
    END IF;
END;
$$;

-- Step 4: Drop the old, now redundant, columns if they exist.
ALTER TABLE public.attentions
DROP COLUMN IF EXISTS attention_date,
DROP COLUMN IF EXISTS attention_time;

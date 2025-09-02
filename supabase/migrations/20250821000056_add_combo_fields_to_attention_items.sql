-- Add combo_id to attention_services
ALTER TABLE public.attention_services
ADD COLUMN combo_id uuid REFERENCES public.attention_combos(id);

-- Add combo_id to attention_products
ALTER TABLE public.attention_products
ADD COLUMN combo_id uuid REFERENCES public.attention_combos(id);

-- Add quantity to attention_combos (if it doesn't exist)
-- Check if the column exists before adding to avoid errors on re-runs
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='attention_combos' AND column_name='quantity') THEN
        ALTER TABLE public.attention_combos ADD COLUMN quantity integer NOT NULL DEFAULT 1;
    END IF;
END
$$;
-- 1. Add platform_id to subscription_plans in a safe, multi-step way.

-- Step 1: Add the column, allowing it to be NULL temporarily.
ALTER TABLE public.subscription_plans
ADD COLUMN platform_id UUID;

-- Step 2: Update all existing plans to belong to the default platform.
-- Replace 'ca9090c3-f6a3-46c3-af1d-6362e2942e5f' with the actual default platform ID if needed.
UPDATE public.subscription_plans
SET platform_id = 'ca9090c3-f6a3-46c3-af1d-6362e2942e5f'
WHERE platform_id IS NULL;

-- Step 3: Now that all rows have a value, enforce the NOT NULL constraint.
ALTER TABLE public.subscription_plans
ALTER COLUMN platform_id SET NOT NULL;

-- Add a foreign key constraint to ensure data integrity.
-- This assumes the 'platforms' table already exists.
ALTER TABLE public.subscription_plans
ADD CONSTRAINT fk_platform
FOREIGN KEY (platform_id)
REFERENCES public.platforms(id)
ON DELETE CASCADE;

-- Add an index for better performance on platform_id lookups.
CREATE INDEX idx_subscription_plans_platform_id ON public.subscription_plans(platform_id);

-- 2. Create the plan_assets table to define available features for a platform.
CREATE TABLE public.plan_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform_id UUID NOT NULL REFERENCES public.platforms(id) ON DELETE CASCADE,
    asset_key TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    data_type TEXT NOT NULL CHECK (data_type IN ('boolean', 'numeric')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- A platform cannot have duplicate asset keys.
    CONSTRAINT unique_asset_key_for_platform UNIQUE (platform_id, asset_key)
);

-- Add indexes for performance.
CREATE INDEX idx_plan_assets_platform_id ON public.plan_assets(platform_id);

-- 3. Create the plan_asset_limits table to assign specific limits to each plan.
CREATE TABLE public.plan_asset_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES public.subscription_plans(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES public.plan_assets(id) ON DELETE CASCADE,
    value TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- A plan can only have one limit for a specific asset.
    CONSTRAINT unique_asset_for_plan UNIQUE (plan_id, asset_id)
);

-- Add indexes for performance.
CREATE INDEX idx_plan_asset_limits_plan_id ON public.plan_asset_limits(plan_id);
CREATE INDEX idx_plan_asset_limits_asset_id ON public.plan_asset_limits(asset_id);

-- Enable Row Level Security for the new tables.
ALTER TABLE public.plan_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_asset_limits ENABLE ROW LEVEL SECURITY;

-- Create policies to allow super_admin full access.
-- Note: These policies assume a 'super_admin' role check mechanism exists.
CREATE POLICY "Allow full access to super_admin on plan_assets"
ON public.plan_assets
FOR ALL
USING ((SELECT (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'))
WITH CHECK ((SELECT (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'));

CREATE POLICY "Allow full access to super_admin on plan_asset_limits"
ON public.plan_asset_limits
FOR ALL
USING ((SELECT (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'))
WITH CHECK ((SELECT (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'));

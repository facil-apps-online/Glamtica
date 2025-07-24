-- MIGRATION: Implement scalable subscription assets and branch status tracking (Corrected Trigger Logic)

-- Step 1: Create ENUM types for standardizing statuses and types
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'branch_status') THEN
        CREATE TYPE public.branch_status AS ENUM ('active', 'pending_activation', 'archived');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_asset_type') THEN
        CREATE TYPE public.subscription_asset_type AS ENUM ('branch', 'user'); -- Prepared for future scalability
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_asset_status') THEN
        CREATE TYPE public.subscription_asset_status AS ENUM ('active', 'cancelled');
    END IF;
END $$;

-- Step 2: Add status and activation columns to the branches table
ALTER TABLE public.branches
ADD COLUMN IF NOT EXISTS status public.branch_status NOT NULL DEFAULT 'pending_activation',
ADD COLUMN IF NOT EXISTS activated_at TIMESTAMPTZ;

-- Step 3: Create the new subscription_assets table with UUID primary key
CREATE TABLE IF NOT EXISTS public.subscription_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_subscription_id UUID NOT NULL REFERENCES public.tenant_subscriptions(id) ON DELETE CASCADE,
    asset_type public.subscription_asset_type NOT NULL,
    asset_reference_id UUID NOT NULL, -- e.g., the id from the 'branches' table
    status public.subscription_asset_status NOT NULL DEFAULT 'active',
    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    cancelled_at TIMESTAMPTZ,
    price_at_addition NUMERIC(10, 2) NOT NULL,
    CONSTRAINT uq_active_asset UNIQUE (tenant_subscription_id, asset_type, asset_reference_id, status)
);
COMMENT ON TABLE public.subscription_assets IS 'Tracks billable assets (like branches, users) attached to a subscription.';
COMMENT ON COLUMN public.subscription_assets.asset_reference_id IS 'FK to the specific asset table, e.g., branches.id';
COMMENT ON COLUMN public.subscription_assets.price_at_addition IS 'Price of the asset at the time of addition to handle price changes.';

-- Step 4: Create the branch status history table for auditing
CREATE TABLE IF NOT EXISTS public.branch_status_history (
    id BIGSERIAL PRIMARY KEY,
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
    status public.branch_status NOT NULL,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    changed_by UUID NULL REFERENCES auth.users(id)
);
COMMENT ON TABLE public.branch_status_history IS 'Audit trail for status changes on the branches table.';

-- Step 5: Create the trigger function with corrected logic inside
CREATE OR REPLACE FUNCTION public.log_branch_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- For UPDATEs, only log if the status actually changed.
    -- For INSERTs, OLD is NULL, so the condition is met and the initial state is logged.
    IF TG_OP = 'INSERT' OR (OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO public.branch_status_history (branch_id, status, changed_at)
        VALUES (NEW.id, NEW.status, NOW());
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Create the trigger on the branches table (without the faulty WHEN clause)
DROP TRIGGER IF EXISTS trg_branch_status_change ON public.branches;
CREATE TRIGGER trg_branch_status_change
AFTER INSERT OR UPDATE OF status ON public.branches
FOR EACH ROW
EXECUTE FUNCTION public.log_branch_status_change();

-- Step 7: Initialize status for existing main branches
-- This update will fire the trigger for the main branches, creating their first history record.
UPDATE public.branches
SET
  status = 'active',
  activated_at = NOW()
WHERE
  is_main_branch = TRUE AND status = 'pending_activation';
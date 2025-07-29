-- Migration: 20250725000014_setup_universe_architecture.sql
-- Description: Establishes the foundational tables for the "Universe" architecture,
-- supporting multiple platforms and investors.

-- Step 1: Create the platforms table.
-- This table defines each application within the ecosystem (e.g., Glamtica, App B).
CREATE TABLE IF NOT EXISTS public.platforms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    base_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE public.platforms IS 'Defines the applications within the multi-platform universe.';

-- Step 2: Create the investor_platform_stakes table.
-- This table links investors (users) to platforms and records their stake percentage.
CREATE TABLE IF NOT EXISTS public.investor_platform_stakes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    investor_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    platform_id UUID NOT NULL REFERENCES public.platforms(id) ON DELETE CASCADE,
    stake_percentage NUMERIC(5, 2) NOT NULL CHECK (stake_percentage > 0 AND stake_percentage <= 100),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (investor_user_id, platform_id)
);
COMMENT ON TABLE public.investor_platform_stakes IS 'Tracks investor user stakes in different platforms.';

-- Step 3: Add the platform_id column to the tenants table.
-- This links each tenant (customer) to a specific platform.
ALTER TABLE public.tenants
ADD COLUMN IF NOT EXISTS platform_id UUID REFERENCES public.platforms(id) ON DELETE SET NULL;

-- Step 4: Seed the first platform, "Glamtica".
-- We insert it here so that other migrations and foreign keys can rely on it.
INSERT INTO public.platforms (name, description, base_url)
VALUES ('Glamtica', 'ERP system for beauty salons and barbershops', 'https://glamtica.app')
ON CONFLICT (name) DO NOTHING;

-- Step 5: Update the tenants table to link all existing tenants to Glamtica.
-- This is a safe assumption for the initial migration.
UPDATE public.tenants
SET platform_id = (SELECT id FROM public.platforms WHERE name = 'Glamtica')
WHERE platform_id IS NULL;

-- Step 6: Now that all existing tenants have a platform_id, make the column NOT NULL.
ALTER TABLE public.tenants
ALTER COLUMN platform_id SET NOT NULL;

-- COMMENT: Establishes the core tables (platforms, investor_platform_stakes) and links tenants to platforms, laying the groundwork for the multi-platform ecosystem.

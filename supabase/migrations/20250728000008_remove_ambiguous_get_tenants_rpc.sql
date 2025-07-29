-- Migration: 20250728000008_remove_ambiguous_get_tenants_rpc.sql
-- Description: Removes the old, single-argument version of the get_tenants function
-- to resolve the "ambiguous function call" error.

DROP FUNCTION IF EXISTS public.get_tenants(text);

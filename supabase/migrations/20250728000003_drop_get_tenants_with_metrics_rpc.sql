-- Migration: 20250728000003_drop_get_tenants_with_metrics_rpc.sql
-- Description: Drops the obsolete RPC function 'get_tenants_with_metrics' as its logic
-- has been replaced by the new 'get_tenants' function and moved to the edge function.

DROP FUNCTION IF EXISTS public.get_tenants_with_metrics(TEXT);

-- COMMENT: This cleanup helps maintain a clean and understandable database schema by removing unused functions.

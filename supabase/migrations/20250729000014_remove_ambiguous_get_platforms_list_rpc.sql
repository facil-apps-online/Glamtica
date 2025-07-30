-- Migration: Remove ambiguous get_platforms_list() function
-- Description: Drops the version of get_platforms_list that takes no arguments to resolve the function overload error.

DROP FUNCTION IF EXISTS public.get_platforms_list();

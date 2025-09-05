-- Migration: Drop obsolete 3-parameter get_product_sellers function to resolve overloading ambiguity

DROP FUNCTION IF EXISTS public.get_product_sellers(
  p_product_id UUID,
  p_branch_id UUID,
  p_tenant_id UUID
);

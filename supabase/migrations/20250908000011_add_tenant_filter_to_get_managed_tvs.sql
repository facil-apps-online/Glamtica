CREATE OR REPLACE FUNCTION get_managed_tvs(p_tenant_id UUID)
RETURNS SETOF jsonb
LANGUAGE sql
STABLE
AS $$
  SELECT
    to_jsonb(td) || jsonb_build_object('branch_name', b.name)
  FROM public.tv_displays td
  LEFT JOIN public.branches b ON td.branch_id = b.id
  WHERE td.is_registered = true
  AND td.tenant_id = p_tenant_id;
$$;
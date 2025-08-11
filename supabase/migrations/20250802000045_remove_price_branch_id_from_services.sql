DROP POLICY IF EXISTS tenant_branch_policy_services ON public.services;

ALTER TABLE public.services
DROP COLUMN price,
DROP COLUMN branch_id;
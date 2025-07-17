ALTER TABLE public.branches
ADD COLUMN is_main_branch BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.branches.is_main_branch IS 'Indicates if this is the main branch for the tenant.';

ALTER TABLE public.branches
ADD COLUMN code TEXT;

COMMENT ON COLUMN public.branches.code IS 'A short, unique code for the branch, used in document numbering templates.';

-- 1. Drop the existing status constraint to modify it
ALTER TABLE public.product_transfers DROP CONSTRAINT product_transfers_status_check;

-- 2. Update old status 'en_proceso' to the new 'aprobado' status
UPDATE public.product_transfers SET status = 'aprobado' WHERE status = 'en_proceso';

-- 3. Add the new status constraint with all required values
ALTER TABLE public.product_transfers ADD CONSTRAINT product_transfers_status_check
CHECK (status IN ('solicitado', 'aprobado', 'rechazado', 'en_transito', 'recibido_con_incidencias', 'completado', 'cancelado'));

-- 4. Rename columns for better clarity
ALTER TABLE public.product_transfers RENAME COLUMN from_branch_id TO origin_branch_id;
ALTER TABLE public.product_transfers RENAME COLUMN to_branch_id TO destination_branch_id;

-- 5. Add the column to identify the requesting branch
ALTER TABLE public.product_transfers ADD COLUMN requesting_branch_id UUID REFERENCES public.branches(id);

-- 6. Backfill the new column for existing transfers
-- For old transfers, we'll assume the destination branch was the one requesting it.
UPDATE public.product_transfers SET requesting_branch_id = destination_branch_id;

-- 7. Set the new column as NOT NULL
ALTER TABLE public.product_transfers ALTER COLUMN requesting_branch_id SET NOT NULL;

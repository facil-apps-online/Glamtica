
ALTER TABLE public.attentions DROP CONSTRAINT IF EXISTS attentions_status_check;
ALTER TABLE public.attentions ADD CONSTRAINT attentions_status_check
CHECK (status IN ('Pendiente', 'Confirmada', 'En Proceso', 'Finalizada', 'Pagada', 'Cancelada'));

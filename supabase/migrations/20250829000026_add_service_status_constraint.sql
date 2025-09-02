-- Add status constraint to attention_services

-- Add check constraint for attention_services status
ALTER TABLE public.attention_services
ADD CONSTRAINT valid_status_values
CHECK (status IN ('Pendiente', 'En Progreso', 'Finalizado', 'Cancelado'));

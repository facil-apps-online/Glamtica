-- Drop the old constraint and add a new one with the 'Llamado' state
ALTER TABLE public.attention_services
DROP CONSTRAINT valid_status_values;

ALTER TABLE public.attention_services
ADD CONSTRAINT valid_status_values
CHECK (status IN ('Pendiente', 'Llamado', 'En Progreso', 'Finalizado', 'Cancelado'));

-- Function to call the stylist for a service
CREATE OR REPLACE FUNCTION public.call_stylist(p_attention_service_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.attention_services
  SET
    status = 'Llamado'
  WHERE
    id = p_attention_service_id
    AND status = 'Pendiente';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Functions to manage the lifecycle of an attention service

-- Function to start a service
CREATE OR REPLACE FUNCTION public.start_service(p_attention_service_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.attention_services
  SET
    status = 'En Progreso',
    start_time = CURRENT_TIME
  WHERE
    id = p_attention_service_id
    AND status = 'Pendiente';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to finish a service
CREATE OR REPLACE FUNCTION public.finish_service(p_attention_service_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.attention_services
  SET
    status = 'Finalizado',
    end_time = CURRENT_TIME
  WHERE
    id = p_attention_service_id
    AND status = 'En Progreso';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

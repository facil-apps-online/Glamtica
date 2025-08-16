
-- Función para iniciar una sesión de servicio
CREATE OR REPLACE FUNCTION public.start_service(p_attention_service_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Actualizar el estado del servicio de atención a 'En Proceso'
    UPDATE public.attention_services
    SET status = 'En Proceso'
    WHERE id = p_attention_service_id;

    -- Insertar la nueva sesión de servicio
    INSERT INTO public.service_sessions (attention_service_id, started_at)
    VALUES (p_attention_service_id, now());
END;
$$;

-- Función para finalizar una sesión de servicio
CREATE OR REPLACE FUNCTION public.end_service(p_attention_service_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    v_started_at timestamp with time zone;
BEGIN
    -- Obtener la hora de inicio de la sesión
    SELECT started_at INTO v_started_at
    FROM public.service_sessions
    WHERE attention_service_id = p_attention_service_id
    ORDER BY started_at DESC
    LIMIT 1;

    -- Actualizar la sesión de servicio con la hora de finalización y la duración
    UPDATE public.service_sessions
    SET 
        ended_at = now(),
        duration_minutes = EXTRACT(EPOCH FROM (now() - v_started_at)) / 60
    WHERE attention_service_id = p_attention_service_id AND ended_at IS NULL;

    -- Actualizar el estado del servicio de atención a 'Completado'
    UPDATE public.attention_services
    SET status = 'Completado'
    WHERE id = p_attention_service_id;
END;
$$;

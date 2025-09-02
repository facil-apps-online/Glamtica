-- MIGRATION: Estandarizar estados de atenciones y servicios, y actualizar funciones RPC relacionadas.

BEGIN;

-- PASO 1: Actualizar datos existentes en las tablas.

-- Unificar 'En Progreso' a 'En Proceso'
UPDATE public.attentions SET status = 'En Proceso' WHERE status = 'En Progreso';
UPDATE public.attention_services SET status = 'En Proceso' WHERE status = 'En Progreso';
UPDATE public.attention_service_status_history SET status = 'En Proceso' WHERE status = 'En Progreso';

-- Unificar 'Completada' a 'Finalizada' para atenciones
UPDATE public.attentions SET status = 'Finalizada' WHERE status = 'Completada';

-- Unificar 'Completado' y 'Finalizado' a 'Finalizado' para servicios y combos
UPDATE public.attention_services SET status = 'Finalizado' WHERE status IN ('Completado', 'Finalizado');
UPDATE public.attention_combos SET status = 'Finalizado' WHERE status = 'Completado';
UPDATE public.attention_service_status_history SET status = 'Finalizado' WHERE status = 'Finalizado';


-- PASO 2: Actualizar las CHECK constraints.

-- Constraint para 'attentions'
ALTER TABLE public.attentions DROP CONSTRAINT IF EXISTS attentions_status_check;
ALTER TABLE public.attentions ADD CONSTRAINT attentions_status_check
CHECK (status IN ('Confirmada', 'En Proceso', 'Finalizada', 'Pagada', 'Cancelada'));

-- Constraint para 'attention_services'
ALTER TABLE public.attention_services DROP CONSTRAINT IF EXISTS valid_status_values;
ALTER TABLE public.attention_services ADD CONSTRAINT valid_status_values
CHECK (status IN ('Pendiente', 'Llamado', 'En Proceso', 'Finalizado', 'Cancelado'));


-- PASO 3: Actualizar las funciones RPC que manejan los cambios de estado.

-- Recrear la función para iniciar un servicio, usando 'En Proceso'
CREATE OR REPLACE FUNCTION public.start_attention_service(p_attention_service_id uuid)
RETURNS void AS $$
DECLARE
    v_tenant_id uuid;
    v_branch_id uuid;
    v_user_id uuid;
    v_attention_id uuid;
BEGIN
    -- Obtener IDs necesarios del servicio de atención
    SELECT tenant_id, branch_id, user_id, attention_id INTO v_tenant_id, v_branch_id, v_user_id, v_attention_id
    FROM public.attention_services
    WHERE id = p_attention_service_id;

    -- Actualizar el estado del servicio y la hora de inicio
    UPDATE public.attention_services
    SET 
        status = 'En Proceso',
        start_time = now()
    WHERE id = p_attention_service_id;

    -- Insertar un registro en el historial de estados
    INSERT INTO public.attention_service_status_history
        (attention_service_id, status, tenant_id, branch_id, user_id)
    VALUES
        (p_attention_service_id, 'En Proceso', v_tenant_id, v_branch_id, v_user_id);

    -- Actualizar el estado de la atención principal a 'En Proceso' si es la primera
    UPDATE public.attentions
    SET status = 'En Proceso'
    WHERE id = v_attention_id AND status = 'Confirmada';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recrear la función para finalizar un servicio, usando 'Finalizado'
CREATE OR REPLACE FUNCTION public.finish_attention_service(p_attention_service_id uuid)
RETURNS void AS $$
DECLARE
    v_tenant_id uuid;
    v_branch_id uuid;
    v_user_id uuid;
BEGIN
    -- Obtener IDs necesarios del servicio de atención
    SELECT tenant_id, branch_id, user_id INTO v_tenant_id, v_branch_id, v_user_id
    FROM public.attention_services
    WHERE id = p_attention_service_id;

    -- Actualizar el estado del servicio y la hora de finalización
    UPDATE public.attention_services
    SET 
        status = 'Finalizado',
        end_time = now()
    WHERE id = p_attention_service_id;

    -- Insertar un registro en el historial de estados
    INSERT INTO public.attention_service_status_history
        (attention_service_id, status, tenant_id, branch_id, user_id)
    VALUES
        (p_attention_service_id, 'Finalizado', v_tenant_id, v_branch_id, v_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;

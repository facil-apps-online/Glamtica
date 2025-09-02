-- Function to start a service and record the status change
CREATE OR REPLACE FUNCTION public.start_service(p_attention_service_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tenant_id uuid;
    v_branch_id uuid;
    v_user_id uuid;
    v_attention_id uuid;
BEGIN
    -- Update the service status and start time
    UPDATE public.attention_services
    SET
        status = 'En Progreso',
        start_time = (now() AT TIME ZONE 'UTC')::time
    WHERE id = p_attention_service_id
    RETURNING tenant_id, branch_id, user_id, attention_id INTO v_tenant_id, v_branch_id, v_user_id, v_attention_id;

    -- Insert a record into the status history table
    IF FOUND THEN
        INSERT INTO public.attention_service_status_history
            (attention_service_id, status, tenant_id, branch_id, user_id)
        VALUES
            (p_attention_service_id, 'En Progreso', v_tenant_id, v_branch_id, v_user_id);
        
        -- Update the main attention status to 'En Proceso'
        UPDATE public.attentions
        SET status = 'En Proceso'
        WHERE id = v_attention_id;
    END IF;
END;
$$;

-- Function to end a service and record the status change
CREATE OR REPLACE FUNCTION public.end_service(p_attention_service_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tenant_id uuid;
    v_branch_id uuid;
    v_user_id uuid;
BEGIN
    -- Update the service status and end time
    UPDATE public.attention_services
    SET
        status = 'Finalizado',
        end_time = (now() AT TIME ZONE 'UTC')::time
    WHERE id = p_attention_service_id
    RETURNING tenant_id, branch_id, user_id INTO v_tenant_id, v_branch_id, v_user_id;

    -- Insert a record into the status history table
    IF FOUND THEN
        INSERT INTO public.attention_service_status_history
            (attention_service_id, status, tenant_id, branch_id, user_id)
        VALUES
            (p_attention_service_id, 'Finalizado', v_tenant_id, v_branch_id, v_user_id);
    END IF;
END;
$$;

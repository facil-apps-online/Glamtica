
CREATE OR REPLACE FUNCTION public.create_full_attention(
    p_client_id uuid,
    p_attention_date date,
    p_attention_time time,
    p_notes text,
    p_services jsonb,
    p_tenant_id uuid,
    p_branch_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
    v_attention_id uuid;
    v_service jsonb;
    v_total_amount numeric := 0;
BEGIN
    -- Calcular el monto total de los servicios
    FOR v_service IN SELECT * FROM jsonb_array_elements(p_services)
    LOOP
        v_total_amount := v_total_amount + (v_service->>'service_price')::numeric;
    END LOOP;

    -- Insertar la atención principal
    INSERT INTO public.attentions (client_id, attention_date, attention_time, notes, total_amount, tenant_id, branch_id)
    VALUES (p_client_id, p_attention_date, p_attention_time, p_notes, v_total_amount, p_tenant_id, p_branch_id)
    RETURNING id INTO v_attention_id;

    -- Insertar cada servicio de la atención
    FOR v_service IN SELECT * FROM jsonb_array_elements(p_services)
    LOOP
        INSERT INTO public.attention_services (attention_id, service_id, user_id, service_price, notes, tenant_id, branch_id)
        VALUES (
            v_attention_id,
            (v_service->>'service_id')::uuid,
            (v_service->>'user_id')::uuid,
            (v_service->>'service_price')::numeric,
            v_service->>'notes',
            p_tenant_id,
            p_branch_id
        );
    END LOOP;

    RETURN v_attention_id;
END;
$$;

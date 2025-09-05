-- Migration: Update create_full_attention to remove user_id from attention_combos insert

DROP FUNCTION IF EXISTS public.create_full_attention(uuid, timestamptz, text, jsonb, jsonb, jsonb, uuid, uuid, numeric) CASCADE;

CREATE OR REPLACE FUNCTION public.create_full_attention(
    p_client_id uuid,
    p_attention_datetime timestamptz,
    p_notes text,
    p_services jsonb,
    p_products jsonb,
    p_combos jsonb,
    p_tenant_id uuid,
    p_branch_id uuid,
    p_total_amount numeric
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
    v_attention_id uuid;
    v_service jsonb;
    v_product jsonb;
    v_combo jsonb;
    v_attention_combo_id uuid;
    v_combo_service_data jsonb;
BEGIN
    -- Insert the main attention record
    INSERT INTO public.attentions (client_id, attention_datetime, notes, total_amount, tenant_id, branch_id, status)
    VALUES (p_client_id, p_attention_datetime, p_notes, p_total_amount, p_tenant_id, p_branch_id, 'Confirmada')
    RETURNING id INTO v_attention_id;

    -- Insert combos and get their new IDs
    IF jsonb_array_length(p_combos) > 0 THEN
        FOR v_combo IN SELECT * FROM jsonb_array_elements(p_combos)
        LOOP
            INSERT INTO public.attention_combos (
                attention_id, combo_id, price, quantity, notes, tenant_id, branch_id, status
            )
            VALUES (
                v_attention_id, 
                (v_combo->>'combo_id')::uuid, 
                COALESCE((v_combo->>'price')::numeric, 0), 
                COALESCE((v_combo->>'quantity')::integer, 1), 
                v_combo->>'notes', 
                p_tenant_id, 
                p_branch_id, 
                'Pendiente'
            )
            RETURNING id INTO v_attention_combo_id;

            -- Associate the generated attention_combo_id back to the services in the payload
            FOR v_combo_service_data IN SELECT * FROM jsonb_array_elements(p_services)
            LOOP
                IF (v_combo_service_data->>'combo_id')::uuid = (v_combo->>'combo_id')::uuid THEN
                    -- This service belongs to the combo we just inserted.
                    -- We add/update the attention_combo_id to this service object.
                    v_combo_service_data := v_combo_service_data || jsonb_build_object('attention_combo_id', v_attention_combo_id);
                    
                    -- Update the main p_services array (this is complex in plpgsql, so we handle it on insert)
                END IF;
            END LOOP;
        END LOOP;
    END IF;

    -- Insert services (both standalone and from combos)
    IF jsonb_array_length(p_services) > 0 THEN
        FOR v_service IN SELECT * FROM jsonb_array_elements(p_services)
        LOOP
            -- Find the corresponding combo in p_combos to get the generated v_attention_combo_id
            SELECT ac.id INTO v_attention_combo_id
            FROM public.attention_combos ac
            WHERE ac.attention_id = v_attention_id AND ac.combo_id = (v_service->>'combo_id')::uuid;

            INSERT INTO public.attention_services (
                attention_id, service_id, user_id, service_price, notes, tenant_id, branch_id, 
                duration_minutes, start_time, end_time, is_parallel, offset_minutes, status, combo_id
            )
            VALUES (
                v_attention_id, 
                (v_service->>'service_id')::uuid, 
                (v_service->>'user_id')::uuid, -- Granular user_id from the service payload
                COALESCE((v_service->>'price')::numeric, 0), 
                v_service->>'notes', 
                p_tenant_id, 
                p_branch_id, 
                (v_service->>'duration')::integer, 
                (v_service->>'start_time')::time, 
                (v_service->>'end_time')::time,
                (v_service->>'is_parallel')::boolean,
                (v_service->>'offset_minutes')::integer,
                'Pendiente',
                v_attention_combo_id -- Link to the specific attention_combos record
            );
        END LOOP;
    END IF;

    -- Insert products (both standalone and from combos)
    IF jsonb_array_length(p_products) > 0 THEN
        FOR v_product IN SELECT * FROM jsonb_array_elements(p_products)
        LOOP
             -- Find the corresponding combo in p_combos to get the generated v_attention_combo_id
            SELECT ac.id INTO v_attention_combo_id
            FROM public.attention_combos ac
            WHERE ac.attention_id = v_attention_id AND ac.combo_id = (v_product->>'combo_id')::uuid;

            INSERT INTO public.attention_products (
                attention_id, product_id, user_id, quantity, unit_price, total_price, tenant_id, branch_id, combo_id
            )
            VALUES (
                v_attention_id, 
                (v_product->>'product_id')::uuid, 
                (v_product->>'user_id')::uuid, 
                COALESCE((v_product->>'quantity')::integer, 0), 
                COALESCE((v_product->>'unit_price')::numeric, 0), 
                COALESCE((v_product->>'unit_price')::numeric, 0) * COALESCE((v_product->>'quantity')::integer, 0), 
                p_tenant_id, 
                p_branch_id,
                v_attention_combo_id -- Link to the specific attention_combos record
            );
        END LOOP;
    END IF;

    RETURN v_attention_id;
END;
$$;

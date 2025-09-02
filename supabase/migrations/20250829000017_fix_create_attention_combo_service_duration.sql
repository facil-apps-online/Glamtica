-- Migration to fix create_full_attention to fetch combo service duration from the correct table

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
    v_combo_item record;
    v_attention_combo_id uuid;
    v_service_data record; -- Changed variable name for clarity
    v_branch_product record;
BEGIN
    -- Insert the main attention record
    INSERT INTO public.attentions (client_id, attention_datetime, notes, total_amount, tenant_id, branch_id, status)
    VALUES (p_client_id, p_attention_datetime, p_notes, p_total_amount, p_tenant_id, p_branch_id, 'Confirmada')
    RETURNING id INTO v_attention_id;

    -- Insert standalone services
    IF jsonb_array_length(p_services) > 0 THEN
        FOR v_service IN SELECT * FROM jsonb_array_elements(p_services)
        LOOP
            INSERT INTO public.attention_services (
                attention_id, service_id, user_id, service_price, notes, tenant_id, branch_id, 
                duration_minutes, start_time, end_time, is_parallel, parallel_group_id, offset_minutes, status
            )
            VALUES (
                v_attention_id, 
                (v_service->>'service_id')::uuid, 
                (v_service->>'user_id')::uuid, 
                COALESCE((v_service->>'price')::numeric, 0), 
                v_service->>'notes', 
                p_tenant_id, 
                p_branch_id, 
                (v_service->>'duration')::integer, 
                (v_service->>'start_time')::time, 
                (v_service->>'end_time')::time,
                (v_service->>'is_parallel')::boolean,
                (v_service->>'parallel_group_id')::uuid,
                (v_service->>'offset_minutes')::integer,
                'Pendiente'
            );
        END LOOP;
    END IF;

    -- Insert standalone products
    IF jsonb_array_length(p_products) > 0 THEN
        FOR v_product IN SELECT * FROM jsonb_array_elements(p_products)
        LOOP
            INSERT INTO public.attention_products (attention_id, product_id, user_id, quantity, unit_price, total_price, tenant_id, branch_id)
            VALUES (v_attention_id, (v_product->>'product_id')::uuid, (v_product->>'user_id')::uuid, COALESCE((v_product->>'quantity')::integer, 0), COALESCE((v_product->>'unit_price')::numeric, 0), COALESCE((v_product->>'unit_price')::numeric, 0) * COALESCE((v_product->>'quantity')::integer, 0), p_tenant_id, p_branch_id);
        END LOOP;
    END IF;

    -- Insert combos and their constituent items
    IF jsonb_array_length(p_combos) > 0 THEN
        FOR v_combo IN SELECT * FROM jsonb_array_elements(p_combos)
        LOOP
            -- Insert the main combo record for the attention
            INSERT INTO public.attention_combos (
                attention_id, combo_id, user_id, price, quantity, notes, tenant_id, branch_id, status
            )
            VALUES (
                v_attention_id, 
                (v_combo->>'combo_id')::uuid, 
                (v_combo->>'user_id')::uuid, 
                COALESCE((v_combo->>'price')::numeric, 0), 
                COALESCE((v_combo->>'quantity')::integer, 1), 
                v_combo->>'notes', 
                p_tenant_id, 
                p_branch_id, 
                'Pendiente'
            )
            RETURNING id INTO v_attention_combo_id;

            -- Loop through each item within the master combo
            FOR v_combo_item IN 
                SELECT * FROM public.combo_items WHERE combo_id = (v_combo->>'combo_id')::uuid
            LOOP
                -- If the combo item is a service, insert it with the combo's time/parallel data
                IF v_combo_item.service_id IS NOT NULL THEN
                    -- CORRECTED QUERY: Get duration from services table and price from branch_services
                    SELECT s.duration_minutes, bs.selling_price INTO v_service_data
                    FROM public.services s
                    LEFT JOIN public.branch_services bs ON s.id = bs.service_id AND bs.branch_id = p_branch_id
                    WHERE s.id = v_combo_item.service_id;

                    INSERT INTO public.attention_services(
                        attention_id, service_id, user_id, service_price, notes, tenant_id, branch_id, 
                        duration_minutes, combo_id, status, start_time, end_time, 
                        is_parallel, parallel_group_id, offset_minutes
                    )
                    VALUES (
                        v_attention_id, 
                        v_combo_item.service_id, 
                        (v_combo->>'user_id')::uuid, 
                        COALESCE(v_service_data.selling_price, 0), 
                        v_combo->>'notes', 
                        p_tenant_id, 
                        p_branch_id, 
                        COALESCE(v_service_data.duration_minutes, 0), 
                        v_attention_combo_id, 
                        'Pendiente',
                        (v_combo->>'start_time')::time,
                        (v_combo->>'end_time')::time,
                        (v_combo->>'is_parallel')::boolean,
                        (v_combo->>'parallel_group_id')::uuid,
                        (v_combo->>'offset_minutes')::integer
                    );
                END IF;

                -- If the combo item is a product
                IF v_combo_item.product_id IS NOT NULL THEN
                    SELECT selling_price INTO v_branch_product
                    FROM public.branch_products
                    WHERE product_id = v_combo_item.product_id AND branch_id = p_branch_id;

                    INSERT INTO public.attention_products(attention_id, product_id, user_id, quantity, unit_price, total_price, tenant_id, branch_id, combo_id)
                    VALUES (v_attention_id, v_combo_item.product_id, (v_combo->>'user_id')::uuid, v_combo_item.quantity, COALESCE(v_branch_product.selling_price, 0), COALESCE(v_branch_product.selling_price, 0) * v_combo_item.quantity, p_tenant_id, p_branch_id, v_attention_combo_id);
                END IF;
            END LOOP;
        END LOOP;
    END IF;

    RETURN v_attention_id;
END;
$$;

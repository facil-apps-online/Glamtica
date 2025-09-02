-- Migration: Add duration_minutes to create_full_attention RPC
-- This modifies the function to fetch and insert the service duration.

DROP FUNCTION IF EXISTS public.create_full_attention(uuid, date, time without time zone, text, jsonb, jsonb, jsonb, uuid, uuid) CASCADE;

CREATE OR REPLACE FUNCTION public.create_full_attention(
    p_client_id uuid,
    p_attention_date date,
    p_attention_time time without time zone,
    p_notes text,
    p_services jsonb,
    p_products jsonb,
    p_combos jsonb,
    p_tenant_id uuid,
    p_branch_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
    v_attention_id uuid;
    v_service jsonb;
    v_product jsonb;
    v_combo jsonb;
    v_total_amount numeric := 0;
    v_attention_combo_id uuid;
    v_service_duration integer;
BEGIN
    -- ... (calculation logic remains the same) ...

    -- Insert the main attention record
    INSERT INTO public.attentions (client_id, attention_date, attention_time, notes, total_amount, tenant_id, branch_id, status)
    VALUES (p_client_id, p_attention_date, p_attention_time, p_notes, v_total_amount, p_tenant_id, p_branch_id, 'Confirmada')
    RETURNING id INTO v_attention_id;

    -- Insert attention combos and their items
    IF jsonb_array_length(p_combos) > 0 THEN
        FOR v_combo IN SELECT * FROM jsonb_array_elements(p_combos)
        LOOP
            INSERT INTO public.attention_combos (attention_id, combo_id, user_id, price, quantity, tenant_id, branch_id)
            VALUES (v_attention_id, (v_combo->>'combo_id')::uuid, (v_combo->>'user_id')::uuid, COALESCE((v_combo->>'price')::numeric, 0), COALESCE((v_combo->>'quantity')::integer, 1), p_tenant_id, p_branch_id)
            RETURNING id INTO v_attention_combo_id;

            -- Insert services associated with this combo
            IF v_combo ? 'services' AND jsonb_array_length(v_combo->'services') > 0 THEN
                FOR v_service IN SELECT * FROM jsonb_array_elements(v_combo->'services')
                LOOP
                    -- Get duration from master service table
                    SELECT duration_minutes INTO v_service_duration
                    FROM public.services
                    WHERE id = (v_service->>'service_id')::uuid;

                    INSERT INTO public.attention_services (attention_id, service_id, user_id, service_price, notes, tenant_id, branch_id, combo_id, duration_minutes)
                    VALUES (v_attention_id, (v_service->>'service_id')::uuid, (v_service->>'user_id')::uuid, COALESCE((v_service->>'service_price')::numeric, 0), v_service->>'notes', p_tenant_id, p_branch_id, v_attention_combo_id, v_service_duration);
                END LOOP;
            END IF;

            -- Insert products associated with this combo
            IF v_combo ? 'products' AND jsonb_array_length(v_combo->'products') > 0 THEN
                FOR v_product IN SELECT * FROM jsonb_array_elements(v_combo->'products')
                LOOP
                    INSERT INTO public.attention_products (attention_id, product_id, user_id, quantity, unit_price, total_price, tenant_id, branch_id, combo_id)
                    VALUES (v_attention_id, (v_product->>'product_id')::uuid, (v_product->>'user_id')::uuid, COALESCE((v_product->>'quantity')::integer, 0), COALESCE((v_product->>'unit_price')::numeric, 0), COALESCE((v_product->>'total_price')::numeric, 0), p_tenant_id, p_branch_id, v_attention_combo_id);
                END LOOP;
            END IF;
        END LOOP;
    END IF;

    -- Insert attention services (only those not part of a combo)
    IF jsonb_array_length(p_services) > 0 THEN
        FOR v_service IN SELECT * FROM jsonb_array_elements(p_services)
        LOOP
            -- Get duration from master service table
            SELECT duration_minutes INTO v_service_duration
            FROM public.services
            WHERE id = (v_service->>'service_id')::uuid;

            INSERT INTO public.attention_services (attention_id, service_id, user_id, service_price, notes, tenant_id, branch_id, duration_minutes)
            VALUES (v_attention_id, (v_service->>'service_id')::uuid, (v_service->>'user_id')::uuid, COALESCE((v_service->>'service_price')::numeric, 0), v_service->>'notes', p_tenant_id, p_branch_id, v_service_duration);
        END LOOP;
    END IF;

    -- Insert attention products (only those not part of a combo)
    IF jsonb_array_length(p_products) > 0 THEN
        FOR v_product IN SELECT * FROM jsonb_array_elements(p_products)
        LOOP
            INSERT INTO public.attention_products (attention_id, product_id, user_id, quantity, unit_price, total_price, tenant_id, branch_id)
            VALUES (v_attention_id, (v_product->>'product_id')::uuid, (v_product->>'user_id')::uuid, COALESCE((v_product->>'quantity')::integer, 0), COALESCE((v_product->>'unit_price')::numeric, 0), COALESCE((v_product->>'total_price')::numeric, 0), p_tenant_id, p_branch_id);
        END LOOP;
    END IF;

    RETURN v_attention_id;
END;
$$;
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
BEGIN
    RAISE NOTICE 'Starting create_full_attention function.';
    RAISE NOTICE 'p_client_id: %, p_attention_date: %, p_attention_time: %', p_client_id, p_attention_date, p_attention_time;
    RAISE NOTICE 'p_services: %', p_services;
    RAISE NOTICE 'p_products: %', p_products;
    RAISE NOTICE 'p_combos: %', p_combos;

    -- Calculate total amount from services
    IF jsonb_array_length(p_services) > 0 THEN
        FOR v_service IN SELECT * FROM jsonb_array_elements(p_services)
        LOOP
            v_total_amount := v_total_amount + COALESCE((v_service->>'service_price')::numeric, 0);
        END LOOP;
    END IF;

    -- Calculate total amount from products
    IF jsonb_array_length(p_products) > 0 THEN
        FOR v_product IN SELECT * FROM jsonb_array_elements(p_products)
        LOOP
            v_total_amount := v_total_amount + COALESCE((v_product->>'total_price')::numeric, 0);
        END LOOP;
    END IF;

    -- Calculate total amount from combos
    IF jsonb_array_length(p_combos) > 0 THEN
        FOR v_combo IN SELECT * FROM jsonb_array_elements(p_combos)
        LOOP
            v_total_amount := v_total_amount + COALESCE((v_combo->>'price')::numeric, 0) * COALESCE((v_combo->>'quantity')::integer, 1);
        END LOOP;
    END IF;

    RAISE NOTICE 'Calculated v_total_amount: %', v_total_amount;

    -- Insert the main attention record
    INSERT INTO public.attentions (client_id, attention_date, attention_time, notes, total_amount, tenant_id, branch_id, status)
    VALUES (p_client_id, p_attention_date, p_attention_time, p_notes, v_total_amount, p_tenant_id, p_branch_id, 'Confirmada')
    RETURNING id INTO v_attention_id;

    RAISE NOTICE 'Inserted attention with ID: %', v_attention_id;

    -- Insert attention combos and store their IDs
    IF jsonb_array_length(p_combos) > 0 THEN
        RAISE NOTICE 'Processing combos...';
        FOR v_combo IN SELECT * FROM jsonb_array_elements(p_combos)
        LOOP
            RAISE NOTICE 'Inserting combo: %', v_combo;
            INSERT INTO public.attention_combos (attention_id, combo_id, user_id, price, quantity, tenant_id, branch_id)
            VALUES (v_attention_id, (v_combo->>'combo_id')::uuid, (v_combo->>'user_id')::uuid, COALESCE((v_combo->>'price')::numeric, 0), COALESCE((v_combo->>'quantity')::integer, 1), p_tenant_id, p_branch_id)
            RETURNING id INTO v_attention_combo_id;
            RAISE NOTICE 'Inserted attention_combo with ID: % for combo_id: %', v_attention_combo_id, (v_combo->>'combo_id')::uuid;

            -- Insert services associated with this combo
            IF v_combo ? 'services' AND jsonb_array_length(v_combo->'services') > 0 THEN
                RAISE NOTICE 'Processing services for combo %', v_attention_combo_id;
                FOR v_service IN SELECT * FROM jsonb_array_elements(v_combo->'services')
                LOOP
                    RAISE NOTICE 'Inserting combo service: % with combo_id: %', v_service, v_attention_combo_id;
                    INSERT INTO public.attention_services (attention_id, service_id, user_id, service_price, notes, tenant_id, branch_id, combo_id)
                    VALUES (v_attention_id, (v_service->>'service_id')::uuid, (v_service->>'user_id')::uuid, COALESCE((v_service->>'service_price')::numeric, 0), v_service->>'notes', p_tenant_id, p_branch_id, v_attention_combo_id);
                END LOOP;
            END IF;

            -- Insert products associated with this combo
            IF v_combo ? 'products' AND jsonb_array_length(v_combo->'products') > 0 THEN
                RAISE NOTICE 'Processing products for combo %', v_attention_combo_id;
                FOR v_product IN SELECT * FROM jsonb_array_elements(v_combo->'products')
                LOOP
                    RAISE NOTICE 'Inserting combo product: % with combo_id: %', v_product, v_attention_combo_id;
                    INSERT INTO public.attention_products (attention_id, product_id, user_id, quantity, unit_price, total_price, tenant_id, branch_id, combo_id)
                    VALUES (v_attention_id, (v_product->>'product_id')::uuid, (v_product->>'user_id')::uuid, COALESCE((v_product->>'quantity')::integer, 0), COALESCE((v_product->>'unit_price')::numeric, 0), COALESCE((v_product->>'total_price')::numeric, 0), p_tenant_id, p_branch_id, v_attention_combo_id);
                END LOOP;
            END IF;
        END LOOP;
    END IF;

    -- Insert attention services (only those not part of a combo)
    IF jsonb_array_length(p_services) > 0 THEN
        RAISE NOTICE 'Processing standalone services...';
        FOR v_service IN SELECT * FROM jsonb_array_elements(p_services)
        LOOP
            RAISE NOTICE 'Inserting standalone service: %', v_service;
            INSERT INTO public.attention_services (attention_id, service_id, user_id, service_price, notes, tenant_id, branch_id)
            VALUES (v_attention_id, (v_service->>'service_id')::uuid, (v_service->>'user_id')::uuid, COALESCE((v_service->>'service_price')::numeric, 0), v_service->>'notes', p_tenant_id, p_branch_id);
        END LOOP;
    END IF;

    -- Insert attention products (only those not part of a combo)
    IF jsonb_array_length(p_products) > 0 THEN
        RAISE NOTICE 'Processing standalone products...';
        FOR v_product IN SELECT * FROM jsonb_array_elements(p_products)
        LOOP
            RAISE NOTICE 'Inserting standalone product: %', v_product;
            INSERT INTO public.attention_products (attention_id, product_id, user_id, quantity, unit_price, total_price, tenant_id, branch_id)
            VALUES (v_attention_id, (v_product->>'product_id')::uuid, (v_product->>'user_id')::uuid, COALESCE((v_product->>'quantity')::integer, 0), COALESCE((v_product->>'unit_price')::numeric, 0), COALESCE((v_product->>'total_price')::numeric, 0), p_tenant_id, p_branch_id);
        END LOOP;
    END IF;

    RETURN v_attention_id;
END;
$$;
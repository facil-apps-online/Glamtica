-- Migration: Update update_attention_items to include combos

-- Step 1: Drop the old function
DROP FUNCTION IF EXISTS public.update_attention_items(uuid, jsonb, jsonb, uuid[], uuid[], uuid, uuid);

-- Step 2: Create the new function with combo handling
CREATE OR REPLACE FUNCTION public.update_attention_items(
    p_attention_id uuid,
    p_services_to_upsert jsonb,
    p_products_to_upsert jsonb,
    p_combos_to_upsert jsonb,
    p_service_ids_to_delete uuid[],
    p_product_ids_to_delete uuid[],
    p_combo_ids_to_delete uuid[],
    p_tenant_id uuid,
    p_branch_id uuid
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    v_service jsonb;
    v_product jsonb;
    v_combo jsonb;
    v_total_amount numeric := 0;
    v_attention_status text;
BEGIN
    -- Get the current status of the attention
    SELECT status INTO v_attention_status
    FROM public.attentions
    WHERE id = p_attention_id AND tenant_id = p_tenant_id AND branch_id = p_branch_id;

    -- Check if the attention is editable
    IF v_attention_status IN ('Completada', 'Pagada', 'Cancelada') THEN
        RAISE EXCEPTION 'Cannot modify items of an attention with status %', v_attention_status;
    END IF;

    -- Delete services
    IF array_length(p_service_ids_to_delete, 1) IS NOT NULL THEN
        DELETE FROM public.attention_services
        WHERE attention_id = p_attention_id
          AND id = ANY(p_service_ids_to_delete)
          AND tenant_id = p_tenant_id
          AND branch_id = p_branch_id
          AND status = 'Pendiente';
    END IF;

    -- Delete products
    IF array_length(p_product_ids_to_delete, 1) IS NOT NULL THEN
        DELETE FROM public.attention_products
        WHERE attention_id = p_attention_id
          AND id = ANY(p_product_ids_to_delete)
          AND tenant_id = p_tenant_id
          AND branch_id = p_branch_id;
    END IF;

    -- Delete combos
    IF array_length(p_combo_ids_to_delete, 1) IS NOT NULL THEN
        DELETE FROM public.attention_combos
        WHERE attention_id = p_attention_id
          AND id = ANY(p_combo_ids_to_delete)
          AND tenant_id = p_tenant_id
          AND branch_id = p_branch_id
          AND status = 'Pendiente';
    END IF;

    -- Upsert services
    IF jsonb_array_length(p_services_to_upsert) > 0 THEN
        FOR v_service IN SELECT * FROM jsonb_array_elements(p_services_to_upsert)
        LOOP
            INSERT INTO public.attention_services (id, attention_id, service_id, user_id, price, notes, status, tenant_id, branch_id, duration, start_time, end_time, is_parallel, parallel_group_id, offset_minutes)
            VALUES (
                COALESCE((v_service->>'id')::uuid, gen_random_uuid()),
                p_attention_id,
                (v_service->>'service_id')::uuid,
                (v_service->>'user_id')::uuid,
                (v_service->>'price')::numeric,
                v_service->>'notes',
                COALESCE(v_service->>'status', 'Pendiente'),
                p_tenant_id,
                p_branch_id,
                (v_service->>'duration')::integer,
                (v_service->>'start_time')::time,
                (v_service->>'end_time')::time,
                COALESCE((v_service->>'is_parallel')::boolean, false),
                CASE WHEN v_service->>'parallel_group_id' IS NOT NULL AND v_service->>'parallel_group_id' != 'null' THEN (v_service->>'parallel_group_id')::uuid ELSE NULL END,
                (v_service->>'offset_minutes')::integer
            )
            ON CONFLICT (id) DO UPDATE SET
                service_id = EXCLUDED.service_id,
                user_id = EXCLUDED.user_id,
                price = EXCLUDED.price,
                notes = EXCLUDED.notes,
                status = EXCLUDED.status,
                duration = EXCLUDED.duration,
                start_time = EXCLUDED.start_time,
                end_time = EXCLUDED.end_time,
                is_parallel = EXCLUDED.is_parallel,
                parallel_group_id = EXCLUDED.parallel_group_id,
                offset_minutes = EXCLUDED.offset_minutes;
        END LOOP;
    END IF;

    -- Upsert products
    IF jsonb_array_length(p_products_to_upsert) > 0 THEN
        FOR v_product IN SELECT * FROM jsonb_array_elements(p_products_to_upsert)
        LOOP
            INSERT INTO public.attention_products (id, attention_id, product_id, commission_user_id, quantity, unit_price, tenant_id, branch_id)
            VALUES (
                COALESCE((v_product->>'id')::uuid, gen_random_uuid()),
                p_attention_id,
                (v_product->>'product_id')::uuid,
                (v_product->>'commission_user_id')::uuid,
                (v_product->>'quantity')::integer,
                (v_product->>'unit_price')::numeric,
                p_tenant_id,
                p_branch_id
            )
            ON CONFLICT (id) DO UPDATE SET
                product_id = EXCLUDED.product_id,
                commission_user_id = EXCLUDED.commission_user_id,
                quantity = EXCLUDED.quantity,
                unit_price = EXCLUDED.unit_price;
        END LOOP;
    END IF;

    -- Upsert combos
    IF jsonb_array_length(p_combos_to_upsert) > 0 THEN
        FOR v_combo IN SELECT * FROM jsonb_array_elements(p_combos_to_upsert)
        LOOP
            INSERT INTO public.attention_combos (id, attention_id, combo_id, user_id, price, notes, status, tenant_id, branch_id, duration, start_time, end_time, is_parallel, parallel_group_id, offset_minutes)
            VALUES (
                COALESCE((v_combo->>'id')::uuid, gen_random_uuid()),
                p_attention_id,
                (v_combo->>'combo_id')::uuid,
                (v_combo->>'user_id')::uuid,
                (v_combo->>'price')::numeric,
                v_combo->>'notes',
                COALESCE(v_combo->>'status', 'Pendiente'),
                p_tenant_id,
                p_branch_id,
                (v_combo->>'duration')::integer,
                (v_combo->>'start_time')::time,
                (v_combo->>'end_time')::time,
                COALESCE((v_combo->>'is_parallel')::boolean, false),
                CASE WHEN v_combo->>'parallel_group_id' IS NOT NULL AND v_combo->>'parallel_group_id' != 'null' THEN (v_combo->>'parallel_group_id')::uuid ELSE NULL END,
                (v_combo->>'offset_minutes')::integer
            )
            ON CONFLICT (id) DO UPDATE SET
                combo_id = EXCLUDED.combo_id,
                user_id = EXCLUDED.user_id,
                price = EXCLUDED.price,
                notes = EXCLUDED.notes,
                status = EXCLUDED.status,
                duration = EXCLUDED.duration,
                start_time = EXCLUDED.start_time,
                end_time = EXCLUDED.end_time,
                is_parallel = EXCLUDED.is_parallel,
                parallel_group_id = EXCLUDED.parallel_group_id,
                offset_minutes = EXCLUDED.offset_minutes;
        END LOOP;
    END IF;

    -- Recalculate total amount
    SELECT
        COALESCE((SELECT SUM(price) FROM public.attention_services WHERE attention_id = p_attention_id), 0) +
        COALESCE((SELECT SUM(unit_price * quantity) FROM public.attention_products WHERE attention_id = p_attention_id), 0) +
        COALESCE((SELECT SUM(price) FROM public.attention_combos WHERE attention_id = p_attention_id), 0)
    INTO v_total_amount;

    UPDATE public.attentions
    SET total_amount = v_total_amount
    WHERE id = p_attention_id;

END;
$$;
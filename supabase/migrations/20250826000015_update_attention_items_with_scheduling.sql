-- Migration: Update update_attention_items to save scheduling fields
-- This modifies the function to save start_time, end_time, and is_parallel for each service.

DROP FUNCTION IF EXISTS public.update_attention_items(uuid, jsonb, jsonb, uuid[], uuid[], uuid, uuid) CASCADE;

CREATE OR REPLACE FUNCTION public.update_attention_items(
    p_attention_id uuid,
    p_services_to_upsert jsonb,
    p_products_to_upsert jsonb,
    p_service_ids_to_delete uuid[],
    p_product_ids_to_delete uuid[],
    p_tenant_id uuid,
    p_branch_id uuid
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    v_service jsonb;
    v_product jsonb;
    v_total_amount numeric := 0;
    v_attention_status text;
BEGIN
    -- Check current attention status to prevent updates on completed/cancelled attentions
    SELECT status INTO v_attention_status FROM public.attentions WHERE id = p_attention_id;
    IF v_attention_status IN ('Completada', 'Pagada', 'Cancelada') THEN
        RAISE EXCEPTION 'Cannot update attention with status: %s', v_attention_status;
    END IF;

    -- Eliminar servicios
    IF array_length(p_service_ids_to_delete, 1) IS NOT NULL THEN
        DELETE FROM public.attention_services
        WHERE attention_id = p_attention_id
          AND id = ANY(p_service_ids_to_delete)
          AND tenant_id = p_tenant_id;
    END IF;

    -- Eliminar productos
    IF array_length(p_product_ids_to_delete, 1) IS NOT NULL THEN
        DELETE FROM public.attention_products
        WHERE attention_id = p_attention_id
          AND id = ANY(p_product_ids_to_delete)
          AND tenant_id = p_tenant_id;
    END IF;

    -- Upsert servicios
    IF jsonb_array_length(p_services_to_upsert) > 0 THEN
        FOR v_service IN SELECT * FROM jsonb_array_elements(p_services_to_upsert)
        LOOP
            INSERT INTO public.attention_services (
                id, attention_id, service_id, user_id, service_price, notes, status, tenant_id, branch_id, 
                duration_minutes, start_time, end_time, is_parallel
            )
            VALUES (
                COALESCE((v_service->>'id')::uuid, gen_random_uuid()),
                p_attention_id,
                (v_service->>'service_id')::uuid,
                (v_service->>'user_id')::uuid,
                (v_service->>'service_price')::numeric,
                v_service->>'notes',
                COALESCE(v_service->>'status', 'Pendiente'),
                p_tenant_id,
                p_branch_id,
                (v_service->>'duration')::integer,
                (v_service->>'start_time')::time,
                (v_service->>'end_time')::time,
                (v_service->>'is_parallel')::boolean
            )
            ON CONFLICT (id) DO UPDATE SET
                service_id = EXCLUDED.service_id,
                user_id = EXCLUDED.user_id,
                service_price = EXCLUDED.service_price,
                notes = EXCLUDED.notes,
                status = EXCLUDED.status,
                duration_minutes = (v_service->>'duration')::integer,
                start_time = (v_service->>'start_time')::time,
                end_time = (v_service->>'end_time')::time,
                is_parallel = (v_service->>'is_parallel')::boolean;
        END LOOP;
    END IF;

    -- Upsert productos (lógica existente)
    IF jsonb_array_length(p_products_to_upsert) > 0 THEN
        FOR v_product IN SELECT * FROM jsonb_array_elements(p_products_to_upsert)
        LOOP
            INSERT INTO public.attention_products (id, attention_id, product_id, user_id, quantity, unit_price, total_price, notes, tenant_id, branch_id)
            VALUES (
                COALESCE((v_product->>'id')::uuid, gen_random_uuid()),
                p_attention_id,
                (v_product->>'product_id')::uuid,
                (v_product->>'user_id')::uuid,
                (v_product->>'quantity')::integer,
                (v_product->>'unit_price')::numeric,
                (v_product->>'total_price')::numeric,
                v_product->>'notes',
                p_tenant_id,
                p_branch_id
            )
            ON CONFLICT (id) DO UPDATE SET
                product_id = EXCLUDED.product_id,
                user_id = EXCLUDED.user_id,
                quantity = EXCLUDED.quantity,
                unit_price = EXCLUDED.unit_price,
                total_price = EXCLUDED.total_price,
                notes = EXCLUDED.notes;
        END LOOP;
    END IF;

    -- Recalcular el total de la atención
    SELECT SUM(total) INTO v_total_amount
    FROM (
        SELECT COALESCE(SUM(service_price), 0) as total FROM public.attention_services WHERE attention_id = p_attention_id
        UNION ALL
        SELECT COALESCE(SUM(total_price), 0) as total FROM public.attention_products WHERE attention_id = p_attention_id
    ) as totals;

    UPDATE public.attentions
    SET total_amount = v_total_amount
    WHERE id = p_attention_id;

END;
$$;

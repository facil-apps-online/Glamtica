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
    -- Obtener el estado actual de la atención
    SELECT status INTO v_attention_status
    FROM public.attentions
    WHERE id = p_attention_id AND tenant_id = p_tenant_id AND branch_id = p_branch_id;

    -- Verificar si la atención es editable
    IF v_attention_status IN ('Completada', 'Pagada', 'Cancelada') THEN
        RAISE EXCEPTION 'No se pueden modificar ítems de una atención en estado %', v_attention_status;
    END IF;

    -- Eliminar servicios
    IF array_length(p_service_ids_to_delete, 1) IS NOT NULL THEN
        DELETE FROM public.attention_services
        WHERE attention_id = p_attention_id
          AND id = ANY(p_service_ids_to_delete)
          AND tenant_id = p_tenant_id
          AND branch_id = p_branch_id
          AND status = 'Pendiente'; -- Solo se pueden eliminar servicios pendientes
    END IF;

    -- Eliminar productos
    IF array_length(p_product_ids_to_delete, 1) IS NOT NULL THEN
        DELETE FROM public.attention_products
        WHERE attention_id = p_attention_id
          AND id = ANY(p_product_ids_to_delete)
          AND tenant_id = p_tenant_id
          AND branch_id = p_branch_id;
    END IF;

    -- Upsert servicios
    IF jsonb_array_length(p_services_to_upsert) > 0 THEN
        FOR v_service IN SELECT * FROM jsonb_array_elements(p_services_to_upsert)
        LOOP
            INSERT INTO public.attention_services (id, attention_id, service_id, user_id, service_price, notes, status, tenant_id, branch_id)
            VALUES (
                COALESCE((v_service->>'id')::uuid, gen_random_uuid()), -- Usar ID existente o generar uno nuevo
                p_attention_id,
                (v_service->>'service_id')::uuid,
                (v_service->>'user_id')::uuid,
                (v_service->>'service_price')::numeric,
                v_service->>'notes',
                COALESCE(v_service->>'status', 'Pendiente'), -- Mantener estado o 'Pendiente' para nuevos
                p_tenant_id,
                p_branch_id
            )
            ON CONFLICT (id) DO UPDATE SET
                service_id = EXCLUDED.service_id,
                user_id = EXCLUDED.user_id,
                service_price = EXCLUDED.service_price,
                notes = EXCLUDED.notes,
                status = EXCLUDED.status;
        END LOOP;
    END IF;

    -- Upsert productos
    IF jsonb_array_length(p_products_to_upsert) > 0 THEN
        FOR v_product IN SELECT * FROM jsonb_array_elements(p_products_to_upsert)
        LOOP
            INSERT INTO public.attention_products (id, attention_id, product_id, user_id, quantity, unit_price, total_price, tenant_id, branch_id)
            VALUES (
                COALESCE((v_product->>'id')::uuid, gen_random_uuid()), -- Usar ID existente o generar uno nuevo
                p_attention_id,
                (v_product->>'product_id')::uuid,
                (v_product->>'user_id')::uuid,
                (v_product->>'quantity')::integer,
                (v_product->>'unit_price')::numeric,
                (v_product->>'total_price')::numeric,
                p_tenant_id,
                p_branch_id
            )
            ON CONFLICT (id) DO UPDATE SET
                product_id = EXCLUDED.product_id,
                user_id = EXCLUDED.user_id,
                quantity = EXCLUDED.quantity,
                unit_price = EXCLUDED.unit_price,
                total_price = EXCLUDED.total_price;
        END LOOP;
    END IF;

    -- Recalcular el total de la atención (CORRECCIÓN AQUÍ)
    SELECT
        COALESCE(SUM(aserv.service_price), 0) + COALESCE(SUM(aprod.total_price), 0)
    INTO v_total_amount
    FROM
        public.attentions att
    LEFT JOIN
        public.attention_services aserv ON att.id = aserv.attention_id AND aserv.tenant_id = p_tenant_id AND aserv.branch_id = p_branch_id
    LEFT JOIN
        public.attention_products aprod ON att.id = aprod.attention_id AND aprod.tenant_id = p_tenant_id AND aprod.branch_id = p_branch_id
    WHERE
        att.id = p_attention_id AND att.tenant_id = p_tenant_id AND att.branch_id = p_branch_id;

    UPDATE public.attentions
    SET total_amount = v_total_amount
    WHERE id = p_attention_id AND tenant_id = p_tenant_id AND branch_id = p_branch_id;

END;
$$;
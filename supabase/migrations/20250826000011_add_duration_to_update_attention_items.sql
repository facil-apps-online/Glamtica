-- Migration: Add duration_minutes to update_attention_items RPC
-- This modifies the function to fetch and update the service duration when items are updated.

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
    v_service_duration integer;
BEGIN
    -- ... (logic to check attention status remains the same) ...

    -- Eliminar servicios
    IF array_length(p_service_ids_to_delete, 1) IS NOT NULL THEN
        DELETE FROM public.attention_services
        WHERE attention_id = p_attention_id
          AND id = ANY(p_service_ids_to_delete)
          AND tenant_id = p_tenant_id
          AND branch_id = p_branch_id
          AND status = 'Pendiente';
    END IF;

    -- ... (product deletion remains the same) ...

    -- Upsert servicios
    IF jsonb_array_length(p_services_to_upsert) > 0 THEN
        FOR v_service IN SELECT * FROM jsonb_array_elements(p_services_to_upsert)
        LOOP
            -- Get duration from master service table
            SELECT duration_minutes INTO v_service_duration
            FROM public.services
            WHERE id = (v_service->>'service_id')::uuid;

            INSERT INTO public.attention_services (id, attention_id, service_id, user_id, service_price, notes, status, tenant_id, branch_id, duration_minutes)
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
                v_service_duration
            )
            ON CONFLICT (id) DO UPDATE SET
                service_id = EXCLUDED.service_id,
                user_id = EXCLUDED.user_id,
                service_price = EXCLUDED.service_price,
                notes = EXCLUDED.notes,
                status = EXCLUDED.status,
                duration_minutes = EXCLUDED.duration_minutes; -- <<< ADDED
        END LOOP;
    END IF;

    -- ... (rest of the function remains the same) ...

END;
$$;
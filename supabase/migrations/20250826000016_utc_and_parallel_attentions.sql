-- MIGRATION: Refactor Atenciones for UTC and Parallel Services

-- FASE 1: Corrección de Fecha y Hora a UTC
BEGIN;

-- Paso 1.1: Añadir una nueva columna `attention_datetime_utc` a la tabla `attentions`
ALTER TABLE public.attentions
ADD COLUMN IF NOT EXISTS attention_datetime_utc TIMESTAMPTZ;

-- Paso 1.2: Poblar la nueva columna `attention_datetime_utc` a partir de las columnas existentes.
-- Se utiliza 'America/Bogota' como la zona horaria de referencia para los datos antiguos.
-- Esta es una suposición necesaria; los datos existentes podrían tener imprecisiones si fueron creados en diferentes zonas horarias.
UPDATE public.attentions
SET attention_datetime_utc = (attention_date::text || ' ' || attention_time::text)::timestamp AT TIME ZONE 'America/Bogota'
WHERE attention_datetime_utc IS NULL AND attention_date IS NOT NULL AND attention_time IS NOT NULL;

-- Paso 1.3: Eliminar las columnas de fecha y hora antiguas.
ALTER TABLE public.attentions DROP COLUMN IF EXISTS attention_date;
ALTER TABLE public.attentions DROP COLUMN IF EXISTS attention_time;

-- Paso 1.4: Renombrar la nueva columna UTC a `attention_datetime`.
ALTER TABLE public.attentions RENAME COLUMN attention_datetime_utc TO attention_datetime;

-- Se podría añadir un NOT NULL constraint si se está seguro de que todos los registros fueron actualizados.
-- ALTER TABLE public.attentions ALTER COLUMN attention_datetime SET NOT NULL;

COMMIT;

-- FASE 2: Mejoras para Servicios Paralelos
BEGIN;

-- Paso 2.1: Añadir la columna `parallel_group_id` a `attention_services`.
ALTER TABLE public.attention_services
ADD COLUMN IF NOT EXISTS parallel_group_id UUID;

-- Paso 2.2: Añadir la columna `is_parallel` para compatibilidad con la lógica de UI existente.
ALTER TABLE public.attention_services
ADD COLUMN IF NOT EXISTS is_parallel BOOLEAN DEFAULT FALSE;

COMMIT;


-- FUNCIÓN PRINCIPAL: Recrear `create_full_attention` para usar UTC y manejar servicios paralelos.
-- Se eliminan las versiones antiguas para evitar ambigüedades.
DROP FUNCTION IF EXISTS public.create_full_attention(uuid, date, time without time zone, text, jsonb, jsonb, uuid, uuid);
DROP FUNCTION IF EXISTS public.create_full_attention(uuid, date, time without time zone, text, jsonb, jsonb, jsonb, uuid, uuid);

CREATE OR REPLACE FUNCTION public.create_full_attention(
    p_client_id uuid,
    p_attention_datetime timestamptz, -- Parámetro UTC
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
    v_combo_item jsonb;
BEGIN
    -- Calcular monto total de servicios fuera de combos
    IF p_services IS NOT NULL AND jsonb_array_length(p_services) > 0 THEN
        FOR v_service IN SELECT * FROM jsonb_array_elements(p_services)
        LOOP
            v_total_amount := v_total_amount + (v_service->>'service_price')::numeric;
        END LOOP;
    END IF;

    -- Calcular monto total de productos fuera de combos
    IF p_products IS NOT NULL AND jsonb_array_length(p_products) > 0 THEN
        FOR v_product IN SELECT * FROM jsonb_array_elements(p_products)
        LOOP
            v_total_amount := v_total_amount + (v_product->>'total_price')::numeric;
        END LOOP;
    END IF;

    -- Calcular monto total de combos
    IF p_combos IS NOT NULL AND jsonb_array_length(p_combos) > 0 THEN
        FOR v_combo IN SELECT * FROM jsonb_array_elements(p_combos)
        LOOP
            v_total_amount := v_total_amount + ((v_combo->>'price')::numeric * (v_combo->>'quantity')::integer);
        END LOOP;
    END IF;

    -- Insertar la atención principal usando el nuevo `attention_datetime`
    INSERT INTO public.attentions (client_id, attention_datetime, notes, total_amount, tenant_id, branch_id, status)
    VALUES (p_client_id, p_attention_datetime, p_notes, v_total_amount, p_tenant_id, p_branch_id, 'Confirmada')
    RETURNING id INTO v_attention_id;

    -- Insertar servicios individuales (no en combos)
    IF p_services IS NOT NULL AND jsonb_array_length(p_services) > 0 THEN
        FOR v_service IN SELECT * FROM jsonb_array_elements(p_services)
        LOOP
            INSERT INTO public.attention_services (attention_id, service_id, user_id, service_price, notes, tenant_id, branch_id, status, start_time, end_time, is_parallel, parallel_group_id)
            VALUES (
                v_attention_id,
                (v_service->>'service_id')::uuid,
                (v_service->>'user_id')::uuid,
                (v_service->>'service_price')::numeric,
                v_service->>'notes',
                p_tenant_id,
                p_branch_id,
                'Pendiente',
                (v_service->>'start_time')::time,
                (v_service->>'end_time')::time,
                COALESCE((v_service->>'is_parallel')::boolean, false),
                CASE WHEN v_service->>'parallel_group_id' IS NOT NULL AND v_service->>'parallel_group_id' != 'null' THEN (v_service->>'parallel_group_id')::uuid ELSE NULL END
            );
        END LOOP;
    END IF;

    -- Insertar productos individuales (no en combos)
    IF p_products IS NOT NULL AND jsonb_array_length(p_products) > 0 THEN
        FOR v_product IN SELECT * FROM jsonb_array_elements(p_products)
        LOOP
            INSERT INTO public.attention_products (attention_id, product_id, user_id, quantity, unit_price, total_price, tenant_id, branch_id)
            VALUES (
                v_attention_id,
                (v_product->>'product_id')::uuid,
                (v_product->>'user_id')::uuid,
                (v_product->>'quantity')::integer,
                (v_product->>'unit_price')::numeric,
                (v_product->>'total_price')::numeric,
                p_tenant_id,
                p_branch_id
            );
        END LOOP;
    END IF;

    -- Insertar combos y sus items
    IF p_combos IS NOT NULL AND jsonb_array_length(p_combos) > 0 THEN
        FOR v_combo IN SELECT * FROM jsonb_array_elements(p_combos)
        LOOP
            INSERT INTO public.attention_combos (attention_id, combo_id, user_id, quantity, price, notes, tenant_id, branch_id, status)
            VALUES (
                v_attention_id,
                (v_combo->>'combo_id')::uuid,
                (v_combo->>'user_id')::uuid,
                (v_combo->>'quantity')::integer,
                (v_combo->>'price')::numeric,
                v_combo->>'notes',
                p_tenant_id,
                p_branch_id,
                'Pendiente'
            ) RETURNING id INTO v_attention_combo_id;

            -- Insertar servicios del combo
            IF v_combo->'services' IS NOT NULL AND jsonb_array_length(v_combo->'services') > 0 THEN
                FOR v_combo_item IN SELECT * FROM jsonb_array_elements(v_combo->'services')
                LOOP
                    INSERT INTO public.attention_services (attention_id, service_id, user_id, service_price, notes, tenant_id, branch_id, status, combo_id, start_time, end_time, is_parallel, parallel_group_id)
                    VALUES (
                        v_attention_id,
                        (v_combo_item->>'service_id')::uuid,
                        (v_combo->>'user_id')::uuid,
                        0,
                        'Parte de combo: ' || (SELECT name FROM combos WHERE id = (v_combo->>'combo_id')::uuid),
                        p_tenant_id,
                        p_branch_id,
                        'Pendiente',
                        v_attention_combo_id,
                        (v_combo->>'start_time')::time,
                        (v_combo->>'end_time')::time,
                        COALESCE((v_combo->>'is_parallel')::boolean, false),
                        CASE WHEN v_combo->>'parallel_group_id' IS NOT NULL AND v_combo->>'parallel_group_id' != 'null' THEN (v_combo->>'parallel_group_id')::uuid ELSE NULL END
                    );
                END LOOP;
            END IF;

            -- Insertar productos del combo
            IF v_combo->'products' IS NOT NULL AND jsonb_array_length(v_combo->'products') > 0 THEN
                FOR v_combo_item IN SELECT * FROM jsonb_array_elements(v_combo->'products')
                LOOP
                    INSERT INTO public.attention_products (attention_id, product_id, user_id, quantity, unit_price, total_price, tenant_id, branch_id, combo_id)
                    VALUES (
                        v_attention_id,
                        (v_combo_item->>'product_id')::uuid,
                        (v_combo_item->>'user_id')::uuid,
                        (v_combo_item->>'quantity')::integer,
                        0,
                        0,
                        p_tenant_id,
                        p_branch_id,
                        v_attention_combo_id
                    );
                END LOOP;
            END IF;
        END LOOP;
    END IF;

    RETURN v_attention_id;
END;
$$;

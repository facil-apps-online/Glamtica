-- Migration: Add duration_minutes to attention_services and update related functions

BEGIN;

-- Step 1: Add duration_minutes column to attention_services table if it doesn't exist.
ALTER TABLE public.attention_services
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;

COMMIT;

-- Step 2: Update the create_full_attention function to populate the new duration_minutes column
DROP FUNCTION IF EXISTS public.create_full_attention(uuid, timestamptz, text, jsonb, jsonb, jsonb, uuid, uuid);

CREATE OR REPLACE FUNCTION public.create_full_attention(
    p_client_id uuid,
    p_attention_datetime timestamptz,
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
    v_service_duration integer;
BEGIN
    -- Calculate total amount from services
    IF p_services IS NOT NULL AND jsonb_array_length(p_services) > 0 THEN
        FOR v_service IN SELECT * FROM jsonb_array_elements(p_services)
        LOOP
            v_total_amount := v_total_amount + (v_service->>'service_price')::numeric;
        END LOOP;
    END IF;

    -- Calculate total amount from products
    IF p_products IS NOT NULL AND jsonb_array_length(p_products) > 0 THEN
        FOR v_product IN SELECT * FROM jsonb_array_elements(p_products)
        LOOP
            v_total_amount := v_total_amount + (v_product->>'total_price')::numeric;
        END LOOP;
    END IF;

    -- Calculate total amount from combos
    IF p_combos IS NOT NULL AND jsonb_array_length(p_combos) > 0 THEN
        FOR v_combo IN SELECT * FROM jsonb_array_elements(p_combos)
        LOOP
            v_total_amount := v_total_amount + ((v_combo->>'price')::numeric * (v_combo->>'quantity')::integer);
        END LOOP;
    END IF;

    -- Insert the main attention record
    INSERT INTO public.attentions (client_id, attention_datetime, notes, total_amount, tenant_id, branch_id, status)
    VALUES (p_client_id, p_attention_datetime, p_notes, v_total_amount, p_tenant_id, p_branch_id, 'Confirmada')
    RETURNING id INTO v_attention_id;

    -- Insert services and their durations
    IF p_services IS NOT NULL AND jsonb_array_length(p_services) > 0 THEN
        FOR v_service IN SELECT * FROM jsonb_array_elements(p_services)
        LOOP
            -- Get the duration from the master services table
            SELECT duration_minutes INTO v_service_duration FROM public.services WHERE id = (v_service->>'service_id')::uuid;

            INSERT INTO public.attention_services (attention_id, service_id, user_id, service_price, notes, tenant_id, branch_id, status, start_time, end_time, is_parallel, parallel_group_id, duration_minutes)
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
                CASE WHEN v_service->>'parallel_group_id' IS NOT NULL AND v_service->>'parallel_group_id' != 'null' THEN (v_service->>'parallel_group_id')::uuid ELSE NULL END,
                v_service_duration -- Insert the fetched duration
            );
        END LOOP;
    END IF;

    -- Insert products
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

    -- Insert combos and their items
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

            -- Insert services associated with this combo
            IF v_combo->'services' IS NOT NULL AND jsonb_array_length(v_combo->'services') > 0 THEN
                FOR v_combo_item IN SELECT * FROM jsonb_array_elements(v_combo->'services')
                LOOP
                    -- Get the duration from the master services table
                    SELECT duration_minutes INTO v_service_duration FROM public.services WHERE id = (v_combo_item->>'service_id')::uuid;

                    INSERT INTO public.attention_services (attention_id, service_id, user_id, service_price, notes, tenant_id, branch_id, status, combo_id, start_time, end_time, is_parallel, parallel_group_id, duration_minutes)
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
                        CASE WHEN v_combo->>'parallel_group_id' IS NOT NULL AND v_combo->>'parallel_group_id' != 'null' THEN (v_combo->>'parallel_group_id')::uuid ELSE NULL END,
                        v_service_duration -- Insert the fetched duration
                    );
                END LOOP;
            END IF;

            -- Insert products associated with this combo
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

-- Step 3: Update the get_attentions_with_details function to return the new duration_minutes column
DROP FUNCTION IF EXISTS get_attentions_with_details(uuid, uuid, uuid, text, date, date);

CREATE OR REPLACE FUNCTION get_attentions_with_details(
  p_tenant_id uuid,
  p_branch_id uuid,
  p_user_id uuid,
  p_status_filter text,
  p_date_range_start date,
  p_date_range_end date
)
RETURNS TABLE (
  id uuid,
  created_at timestamp with time zone,
  tenant_id uuid,
  branch_id uuid,
  client_id uuid,
  attention_datetime timestamp with time zone,
  status text,
  notes text,
  clients json,
  attention_services json,
  attention_products json,
  attention_combos json
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH tenant_users AS (
    SELECT u.user_id, u.first_name, u.last_name
    FROM get_tenant_users(p_tenant_id) u
  ),
  attentions_filtered AS (
    SELECT
      a.id,
      a.created_at,
      a.tenant_id,
      a.branch_id,
      a.client_id,
      a.attention_datetime,
      a.status,
      a.notes
    FROM
      public.attentions a
    WHERE
      a.tenant_id = p_tenant_id
      AND (p_branch_id IS NULL OR a.branch_id = p_branch_id)
      AND (p_status_filter IS NULL OR a.status = p_status_filter)
      AND (p_date_range_start IS NULL OR a.attention_datetime::date >= p_date_range_start)
      AND (p_date_range_end IS NULL OR a.attention_datetime::date <= p_date_range_end)
      AND (p_user_id IS NULL OR EXISTS (
        SELECT 1
        FROM public.attention_services aserv
        WHERE aserv.attention_id = a.id AND aserv.user_id = p_user_id
      ))
  )
  SELECT
    af.id,
    af.created_at,
    af.tenant_id,
    af.branch_id,
    af.client_id,
    af.attention_datetime,
    af.status,
    af.notes,
    (
      SELECT json_build_object(
        'id', c.id,
        'name', c.name,
        'phone', c.phone
      )
      FROM public.clients c
      WHERE c.id = af.client_id
      LIMIT 1
    ) as clients,
    (
      SELECT json_agg(
        json_build_object(
          'id', aserv.id,
          'service_id', aserv.service_id,
          'user_id', aserv.user_id,
          'service_price', aserv.service_price,
          'notes', aserv.notes,
          'status', aserv.status,
          'combo_id', aserv.combo_id,
          'duration_minutes', aserv.duration_minutes, -- THE FIX
          'services', (
            SELECT json_build_object(
              'id', s.id,
              'name', s.name
            )
            FROM public.services s
            WHERE s.id = aserv.service_id
            LIMIT 1
          ),
          'users', (
             SELECT json_build_object(
              'id', tu.user_id,
              'first_name', tu.first_name,
              'last_name', tu.last_name
            )
            FROM tenant_users tu
            WHERE tu.user_id = aserv.user_id
            LIMIT 1
          )
        )
      )
      FROM public.attention_services aserv
      WHERE aserv.attention_id = af.id
    ) as attention_services,
    (
      SELECT json_agg(
        json_build_object(
          'id', ap.id,
          'product_id', ap.product_id,
          'user_id', ap.user_id,
          'quantity', ap.quantity,
          'unit_price', ap.unit_price,
          'total_price', ap.total_price,
          'combo_id', ap.combo_id,
          'products', (
            SELECT json_build_object(
              'id', p.id,
              'name', p.name
            )
            FROM public.products p
            WHERE p.id = ap.product_id
          ),
          'users', (
             SELECT json_build_object(
              'id', tu.user_id,
              'first_name', tu.first_name,
              'last_name', tu.last_name
            )
            FROM tenant_users tu
            WHERE tu.user_id = ap.user_id
            LIMIT 1
          )
        )
      )
      FROM public.attention_products ap
      WHERE ap.attention_id = af.id
    ) as attention_products,
    (
      SELECT json_agg(
        json_build_object(
          'id', ac.id,
          'combo_id', ac.combo_id,
          'price', ac.price,
          'quantity', ac.quantity,
          'user_id', ac.user_id,
          'status', ac.status,
          'combos', (
            SELECT json_build_object(
              'id', c.id,
              'name', c.name,
              'combo_items', (
                SELECT json_agg(
                  json_build_object(
                    'id', ci.id,
                    'product_id', ci.product_id,
                    'service_id', ci.service_id,
                    'quantity', ci.quantity,
                    'product', (SELECT json_build_object('name', p.name) FROM public.products p WHERE p.id = ci.product_id),
                    'service', (SELECT json_build_object('name', s.name) FROM public.services s WHERE s.id = ci.service_id)
                  )
                )
                FROM public.combo_items ci
                WHERE ci.combo_id = c.id
              )
            )
            FROM public.combos c
            WHERE c.id = ac.combo_id
          ),
          'users', (
             SELECT json_build_object(
              'id', tu.user_id,
              'first_name', tu.first_name,
              'last_name', tu.last_name
            )
            FROM tenant_users tu
            WHERE tu.user_id = ac.user_id
            LIMIT 1
          )
        )
      )
      FROM public.attention_combos ac
      WHERE ac.attention_id = af.id
    ) as attention_combos
  FROM
    attentions_filtered af;
END;
$$;
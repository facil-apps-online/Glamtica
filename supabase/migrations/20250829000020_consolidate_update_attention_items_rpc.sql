-- Migration to consolidate and fix the update_attention_items RPC

-- Step 1: Drop all known conflicting function signatures to clean the schema cache.
-- Note: We use CASCADE to remove dependent objects, which is safe here as we are recreating it.
-- Dropping Firma #2 signature
DROP FUNCTION IF EXISTS public.update_attention_items(uuid, jsonb, jsonb, jsonb, uuid[], uuid[], uuid[], uuid, uuid) CASCADE;
-- Dropping Firma #3 signature (just in case, to be safe)
DROP FUNCTION IF EXISTS public.update_attention_items(uuid, uuid, uuid, jsonb, jsonb, jsonb, uuid[], uuid[], uuid[]) CASCADE;


-- Step 2: Create the single, definitive version of the function.
-- This uses Firma #3, which is the most recent and correct one.
CREATE OR REPLACE FUNCTION public.update_attention_items(
  p_attention_id uuid,
  p_tenant_id uuid,
  p_branch_id uuid,
  p_services_to_upsert jsonb,
  p_products_to_upsert jsonb,
  p_combos_to_upsert jsonb,
  p_service_ids_to_delete uuid[],
  p_product_ids_to_delete uuid[],
  p_combo_ids_to_delete uuid[]
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  service_item jsonb;
  product_item jsonb;
  combo_item jsonb;
  v_combo_item record;
  v_attention_combo_id uuid;
  v_service_data record;
  v_branch_product record;
BEGIN
  -- 1. Delete items marked for deletion
  IF array_length(p_service_ids_to_delete, 1) > 0 THEN
    DELETE FROM public.attention_services
    WHERE id = ANY(p_service_ids_to_delete) AND attention_id = p_attention_id;
  END IF;

  IF array_length(p_product_ids_to_delete, 1) > 0 THEN
    DELETE FROM public.attention_products
    WHERE id = ANY(p_product_ids_to_delete) AND attention_id = p_attention_id;
  END IF;

  IF array_length(p_combo_ids_to_delete, 1) > 0 THEN
    DELETE FROM public.attention_services WHERE combo_id = ANY(p_combo_ids_to_delete);
    DELETE FROM public.attention_products WHERE combo_id = ANY(p_combo_ids_to_delete);
    DELETE FROM public.attention_combos
    WHERE id = ANY(p_combo_ids_to_delete) AND attention_id = p_attention_id;
  END IF;

  -- 2. Upsert standalone services
  FOR service_item IN SELECT * FROM jsonb_array_elements(p_services_to_upsert)
  LOOP
    INSERT INTO public.attention_services (
      id, attention_id, service_id, user_id, service_price, duration_minutes, start_time, end_time, status, is_parallel, parallel_group_id, offset_minutes, notes, tenant_id, branch_id
    )
    VALUES (
      COALESCE((service_item->>'id')::uuid, gen_random_uuid()),
      p_attention_id, (service_item->>'service_id')::uuid, (service_item->>'user_id')::uuid,
      (service_item->>'price')::numeric, (service_item->>'duration')::integer, (service_item->>'start_time')::time,
      (service_item->>'end_time')::time, service_item->>'status', (service_item->>'is_parallel')::boolean,
      (service_item->>'parallel_group_id')::uuid, (service_item->>'offset_minutes')::integer, service_item->>'notes',
      p_tenant_id, p_branch_id
    )
    ON CONFLICT (id) DO UPDATE SET
      service_id = (service_item->>'service_id')::uuid, user_id = (service_item->>'user_id')::uuid,
      service_price = (service_item->>'price')::numeric, duration_minutes = (service_item->>'duration')::integer,
      start_time = (service_item->>'start_time')::time, end_time = (service_item->>'end_time')::time,
      status = service_item->>'status', is_parallel = (service_item->>'is_parallel')::boolean,
      parallel_group_id = (service_item->>'parallel_group_id')::uuid, offset_minutes = (service_item->>'offset_minutes')::integer,
      notes = service_item->>'notes';
  END LOOP;

  -- 3. Upsert standalone products
  FOR product_item IN SELECT * FROM jsonb_array_elements(p_products_to_upsert)
  LOOP
    INSERT INTO public.attention_products (
      id, attention_id, product_id, user_id, quantity, unit_price, total_price, tenant_id, branch_id
    )
    VALUES (
      COALESCE((product_item->>'id')::uuid, gen_random_uuid()), p_attention_id, (product_item->>'product_id')::uuid,
      (product_item->>'commission_user_id')::uuid, (product_item->>'quantity')::integer, (product_item->>'unit_price')::numeric,
      (product_item->>'quantity')::integer * (product_item->>'unit_price')::numeric, p_tenant_id, p_branch_id
    )
    ON CONFLICT (id) DO UPDATE SET
      product_id = (product_item->>'product_id')::uuid, user_id = (product_item->>'commission_user_id')::uuid,
      quantity = (product_item->>'quantity')::integer, unit_price = (product_item->>'unit_price')::numeric,
      total_price = (product_item->>'quantity')::integer * (product_item->>'unit_price')::numeric;
  END LOOP;

  -- 4. Upsert combos AND THEIR ITEMS
  FOR combo_item IN SELECT * FROM jsonb_array_elements(p_combos_to_upsert)
  LOOP
    INSERT INTO public.attention_combos (
      id, attention_id, combo_id, user_id, price, quantity, status, notes, tenant_id, branch_id
    )
    VALUES (
      COALESCE((combo_item->>'id')::uuid, gen_random_uuid()), p_attention_id, (combo_item->>'combo_id')::uuid,
      (combo_item->>'user_id')::uuid, (combo_item->>'price')::numeric, (combo_item->>'quantity')::integer,
      combo_item->>'status', combo_item->>'notes', p_tenant_id, p_branch_id
    )
    ON CONFLICT (id) DO UPDATE SET
      combo_id = (combo_item->>'combo_id')::uuid, user_id = (combo_item->>'user_id')::uuid,
      price = (combo_item->>'price')::numeric, quantity = (combo_item->>'quantity')::integer,
      status = combo_item->>'status', notes = combo_item->>'notes'
    RETURNING id INTO v_attention_combo_id;

    IF (combo_item->>'id') IS NULL THEN
      FOR v_combo_item IN SELECT * FROM public.combo_items WHERE combo_id = (combo_item->>'combo_id')::uuid
      LOOP
        IF v_combo_item.service_id IS NOT NULL THEN
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
              p_attention_id, v_combo_item.service_id, (combo_item->>'user_id')::uuid, 
              COALESCE(v_service_data.selling_price, 0), combo_item->>'notes', p_tenant_id, p_branch_id, 
              COALESCE(v_service_data.duration_minutes, 0), v_attention_combo_id, 'Pendiente',
              (combo_item->>'start_time')::time, (combo_item->>'end_time')::time,
              (combo_item->>'is_parallel')::boolean, (combo_item->>'parallel_group_id')::uuid,
              (combo_item->>'offset_minutes')::integer
          );
        END IF;

        IF v_combo_item.product_id IS NOT NULL THEN
          SELECT selling_price INTO v_branch_product
          FROM public.branch_products
          WHERE product_id = v_combo_item.product_id AND branch_id = p_branch_id;

          INSERT INTO public.attention_products(attention_id, product_id, user_id, quantity, unit_price, total_price, tenant_id, branch_id, combo_id)
          VALUES (p_attention_id, v_combo_item.product_id, (combo_item->>'user_id')::uuid, v_combo_item.quantity, 
                  COALESCE(v_branch_product.selling_price, 0), 
                  COALESCE(v_branch_product.selling_price, 0) * v_combo_item.quantity, 
                  p_tenant_id, p_branch_id, v_attention_combo_id);
        END IF;
      END LOOP;
    END IF;
  END LOOP;

END;
$$;

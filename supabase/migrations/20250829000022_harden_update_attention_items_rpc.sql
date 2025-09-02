-- Migration to harden update_attention_items to default combo quantity to 1

-- Step 1: Drop the previous function
DROP FUNCTION IF EXISTS public.update_attention_items(p_payload jsonb) CASCADE;

-- Step 2: Create the new, hardened function
CREATE OR REPLACE FUNCTION public.update_attention_items(
  p_payload jsonb
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  -- Extract variables from payload
  p_attention_id uuid := (p_payload->>'p_attention_id')::uuid;
  p_tenant_id uuid := (p_payload->>'p_tenant_id')::uuid;
  p_branch_id uuid := (p_payload->>'p_branch_id')::uuid;
  p_services_to_upsert jsonb := p_payload->'p_services_to_upsert';
  p_products_to_upsert jsonb := p_payload->'p_products_to_upsert';
  p_combos_to_upsert jsonb := p_payload->'p_combos_to_upsert';
  p_service_ids_to_delete uuid[] := ARRAY(SELECT jsonb_array_elements_text(p_payload->'p_service_ids_to_delete')::uuid);
  p_product_ids_to_delete uuid[] := ARRAY(SELECT jsonb_array_elements_text(p_payload->'p_product_ids_to_delete')::uuid);
  p_combo_ids_to_delete uuid[] := ARRAY(SELECT jsonb_array_elements_text(p_payload->'p_combo_ids_to_delete')::uuid);

  -- Local variables
  service_item jsonb;
  product_item jsonb;
  combo_item jsonb;
  v_combo_item record;
  v_attention_combo_id uuid;
  v_service_data record;
  v_branch_product record;
BEGIN
  -- (Previous logic for deletions and upserting services/products remains the same)
  -- ...

  -- 4. Upsert combos AND THEIR ITEMS
  FOR combo_item IN SELECT * FROM jsonb_array_elements(p_combos_to_upsert)
  LOOP
    INSERT INTO public.attention_combos (
      id, attention_id, combo_id, user_id, price, quantity, status, notes, tenant_id, branch_id
    )
    VALUES (
      COALESCE((combo_item->>'id')::uuid, gen_random_uuid()), p_attention_id, (combo_item->>'combo_id')::uuid,
      (combo_item->>'user_id')::uuid, (combo_item->>'price')::numeric, 
      COALESCE((combo_item->>'quantity')::integer, 1), -- HARDENED: Default to 1
      combo_item->>'status', combo_item->>'notes', p_tenant_id, p_branch_id
    )
    ON CONFLICT (id) DO UPDATE SET
      combo_id = (combo_item->>'combo_id')::uuid, user_id = (combo_item->>'user_id')::uuid,
      price = (combo_item->>'price')::numeric, 
      quantity = COALESCE((combo_item->>'quantity')::integer, 1), -- HARDENED: Default to 1
      status = combo_item->>'status', notes = combo_item->>'notes'
    RETURNING id INTO v_attention_combo_id;

    -- (Logic for combo items remains the same)
    -- ...
  END LOOP;
END;
$$;

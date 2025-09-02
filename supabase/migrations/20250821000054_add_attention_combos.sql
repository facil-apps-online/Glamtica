-- 1. Create attention_combos table
CREATE TABLE IF NOT EXISTS public.attention_combos (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    attention_id uuid NOT NULL,
    combo_id uuid NOT NULL,
    user_id uuid NOT NULL,
    price numeric NOT NULL,
    tenant_id uuid NOT NULL,
    branch_id uuid NOT NULL,
    CONSTRAINT attention_combos_pkey PRIMARY KEY (id),
    CONSTRAINT attention_combos_attention_id_fkey FOREIGN KEY (attention_id) REFERENCES public.attentions(id) ON DELETE CASCADE,
    CONSTRAINT attention_combos_combo_id_fkey FOREIGN KEY (combo_id) REFERENCES public.combos(id) ON DELETE RESTRICT,
    CONSTRAINT attention_combos_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE RESTRICT,
    CONSTRAINT attention_combos_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE,
    CONSTRAINT attention_combos_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE
);

ALTER TABLE public.attention_combos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all operations for users based on tenant and branch" ON public.attention_combos
AS PERMISSIVE FOR ALL
TO authenticated
USING (tenant_id = get_current_tenant_id() AND branch_id = get_current_branch_id());

-- 2. Recreate create_full_attention function to include combos

DROP FUNCTION IF EXISTS public.create_full_attention(uuid, date, time without time zone, text, jsonb, jsonb, uuid, uuid);

CREATE OR REPLACE FUNCTION public.create_full_attention(
    p_client_id uuid,
    p_attention_date date,
    p_attention_time time without time zone,
    p_notes text,
    p_services jsonb,
    p_products jsonb,
    p_combos jsonb, -- Added parameter
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
    v_combo jsonb; -- Added variable
    v_total_amount numeric := 0;
BEGIN
    -- Calculate total amount from services
    IF jsonb_array_length(p_services) > 0 THEN
        FOR v_service IN SELECT * FROM jsonb_array_elements(p_services)
        LOOP
            v_total_amount := v_total_amount + (v_service->>'service_price')::numeric;
        END LOOP;
    END IF;

    -- Calculate total amount from products
    IF jsonb_array_length(p_products) > 0 THEN
        FOR v_product IN SELECT * FROM jsonb_array_elements(p_products)
        LOOP
            v_total_amount := v_total_amount + (v_product->>'total_price')::numeric;
        END LOOP;
    END IF;

    -- Calculate total amount from combos
    IF jsonb_array_length(p_combos) > 0 THEN
        FOR v_combo IN SELECT * FROM jsonb_array_elements(p_combos)
        LOOP
            v_total_amount := v_total_amount + (v_combo->>'price')::numeric;
        END LOOP;
    END IF;

    -- Insert the main attention record
    INSERT INTO public.attentions (client_id, attention_date, attention_time, notes, total_amount, tenant_id, branch_id, status)
    VALUES (p_client_id, p_attention_date, p_attention_time, p_notes, v_total_amount, p_tenant_id, p_branch_id, 'Confirmada')
    RETURNING id INTO v_attention_id;

    -- Insert attention services
    IF jsonb_array_length(p_services) > 0 THEN
        FOR v_service IN SELECT * FROM jsonb_array_elements(p_services)
        LOOP
            INSERT INTO public.attention_services (attention_id, service_id, user_id, service_price, notes, tenant_id, branch_id)
            VALUES (v_attention_id, (v_service->>'service_id')::uuid, (v_service->>'user_id')::uuid, (v_service->>'service_price')::numeric, v_service->>'notes', p_tenant_id, p_branch_id);
        END LOOP;
    END IF;

    -- Insert attention products
    IF jsonb_array_length(p_products) > 0 THEN
        FOR v_product IN SELECT * FROM jsonb_array_elements(p_products)
        LOOP
            INSERT INTO public.attention_products (attention_id, product_id, user_id, quantity, unit_price, total_price, tenant_id, branch_id)
            VALUES (v_attention_id, (v_product->>'product_id')::uuid, (v_product->>'user_id')::uuid, (v_product->>'quantity')::integer, (v_product->>'unit_price')::numeric, (v_product->>'total_price')::numeric, p_tenant_id, p_branch_id);
        END LOOP;
    END IF;

    -- Insert attention combos
    IF jsonb_array_length(p_combos) > 0 THEN
        FOR v_combo IN SELECT * FROM jsonb_array_elements(p_combos)
        LOOP
            INSERT INTO public.attention_combos (attention_id, combo_id, user_id, price, tenant_id, branch_id)
            VALUES (v_attention_id, (v_combo->>'combo_id')::uuid, (v_combo->>'user_id')::uuid, (v_combo->>'price')::numeric, p_tenant_id, p_branch_id);
        END LOOP;
    END IF;

    RETURN v_attention_id;
END;
$$;
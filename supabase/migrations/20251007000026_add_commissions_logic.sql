-- Migration V9: Adds commission calculation logic and a table to log earned commissions.

-- Step 1: Create the table to store earned commissions
CREATE TABLE public.earned_commissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sale_id uuid NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    sales_item_id uuid NOT NULL REFERENCES public.sales_items(id) ON DELETE CASCADE,
    commission_amount numeric(10, 2) NOT NULL,
    commission_rate_used numeric(5, 2) NOT NULL,
    source_of_rate TEXT NOT NULL, -- e.g., 'product_specific', 'service_specific', 'user_default'
    status TEXT NOT NULL DEFAULT 'earned', -- States: earned, liquidated, paid
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT positive_commission CHECK (commission_amount >= 0)
);

CREATE INDEX idx_earned_commissions_user_status ON public.earned_commissions (tenant_id, user_id, status);
COMMENT ON TABLE public.earned_commissions IS 'Records each commission earned by a user from a sale item.';

-- Step 2: Create the new version of the function
DROP FUNCTION IF EXISTS public.process_sale_from_attention(uuid);
CREATE OR REPLACE FUNCTION public.process_sale_from_attention(
    p_attention_id uuid
)
RETURNS JSONB AS $$ -- Returns a JSON object with saleId and generated commissions
DECLARE
    attention_rec RECORD;
    sale_id_new uuid;
    sale_number_new text;
    combo_item RECORD;
    service_item RECORD;
    product_item RECORD;
    new_sales_item_id uuid;
    combo_parent_id uuid;
    total_subtotal_amt numeric;
    total_tax_amt numeric;
    total_amt numeric;
    product_cost numeric;
    v_staff_user_id uuid;
    v_commission_rate numeric;
    v_commission_amount numeric;
    v_rate_source text;
    v_commissions_array JSONB[] := '{}'::JSONB[];
BEGIN
    -- Step 1: Fetch attention details
    SELECT * INTO attention_rec FROM public.attentions WHERE id = p_attention_id;

    -- Step 2: Get the next sale number
    sale_number_new := public.get_next_document_number(attention_rec.tenant_id, 'SALE'::text, attention_rec.branch_id);

    -- Step 3: Create the main 'sales' record
    INSERT INTO public.sales (tenant_id, branch_id, client_id, attention_id, sale_number, sale_date, status)
    VALUES (attention_rec.tenant_id, attention_rec.branch_id, attention_rec.client_id, p_attention_id, sale_number_new, now(), 'COMPLETED')
    RETURNING id INTO sale_id_new;

    -- Step 4: Process and insert sale items and calculate commissions

    -- Process standalone services
    FOR service_item IN
        SELECT ats.id as attention_service_id, s.name as service_name, s.id as service_id, ats.service_price, ats.user_id
        FROM public.attention_services ats JOIN public.services s ON ats.service_id = s.id
        WHERE ats.attention_id = p_attention_id AND ats.combo_id IS NULL
    LOOP
        INSERT INTO public.sales_items (sale_id, item_type, service_id, description, quantity, unit_price, subtotal_price, total_price)
        VALUES (sale_id_new, 'SERVICE', service_item.service_id, service_item.service_name, 1, service_item.service_price, service_item.service_price, service_item.service_price)
        RETURNING id INTO new_sales_item_id;

        -- Commission Logic for Services
        v_staff_user_id := service_item.user_id;
        IF v_staff_user_id IS NOT NULL THEN
            -- Tier 1: Specific commission rate
            SELECT commission_rate INTO v_commission_rate FROM public.service_user_commissions
            WHERE service_id = service_item.service_id AND user_id = v_staff_user_id AND branch_id = attention_rec.branch_id;
            v_rate_source := 'service_specific';

            -- Tier 2: Default commission rate
            IF NOT FOUND OR v_commission_rate = 0 THEN
                SELECT default_service_commission_rate INTO v_commission_rate FROM public.user_assignments
                WHERE user_id = v_staff_user_id AND branch_id = attention_rec.branch_id;
                v_rate_source := 'user_default';
            END IF;

            IF FOUND AND v_commission_rate > 0 THEN
                v_commission_amount := service_item.service_price * (v_commission_rate / 100.0);
                INSERT INTO public.earned_commissions (tenant_id, branch_id, user_id, sale_id, sales_item_id, commission_amount, commission_rate_used, source_of_rate)
                VALUES (attention_rec.tenant_id, attention_rec.branch_id, v_staff_user_id, sale_id_new, new_sales_item_id, v_commission_amount, v_commission_rate, v_rate_source);
                
                v_commissions_array := v_commissions_array || jsonb_build_object('user_id', v_staff_user_id, 'amount', v_commission_amount, 'item_name', service_item.service_name);
            END IF;
        END IF;
    END LOOP;

    -- Process standalone products
    FOR product_item IN
        SELECT p.name as product_name, p.id as product_id, atp.unit_price, atp.quantity, atp.user_id
        FROM public.attention_products atp JOIN public.products p ON atp.product_id = p.id
        WHERE atp.attention_id = p_attention_id AND atp.combo_id IS NULL
    LOOP
        INSERT INTO public.sales_items (sale_id, item_type, product_id, description, quantity, unit_price, subtotal_price, total_price)
        VALUES (sale_id_new, 'PRODUCT', product_item.product_id, product_item.product_name, product_item.quantity, product_item.unit_price, product_item.unit_price * product_item.quantity, product_item.unit_price * product_item.quantity)
        RETURNING id INTO new_sales_item_id;

        -- Commission Logic for Products
        v_staff_user_id := product_item.user_id;
        IF v_staff_user_id IS NOT NULL THEN
            -- Tier 1: Specific commission rate
            SELECT commission_rate INTO v_commission_rate FROM public.product_user_commissions
            WHERE product_id = product_item.product_id AND user_id = v_staff_user_id AND branch_id = attention_rec.branch_id;
            v_rate_source := 'product_specific';

            -- Tier 2: Default commission rate
            IF NOT FOUND OR v_commission_rate = 0 THEN
                SELECT default_product_commission_rate INTO v_commission_rate FROM public.user_assignments
                WHERE user_id = v_staff_user_id AND branch_id = attention_rec.branch_id;
                v_rate_source := 'user_default';
            END IF;

            IF FOUND AND v_commission_rate > 0 THEN
                v_commission_amount := (product_item.unit_price * product_item.quantity) * (v_commission_rate / 100.0);
                INSERT INTO public.earned_commissions (tenant_id, branch_id, user_id, sale_id, sales_item_id, commission_amount, commission_rate_used, source_of_rate)
                VALUES (attention_rec.tenant_id, attention_rec.branch_id, v_staff_user_id, sale_id_new, new_sales_item_id, v_commission_amount, v_commission_rate, v_rate_source);

                v_commissions_array := v_commissions_array || jsonb_build_object('user_id', v_staff_user_id, 'amount', v_commission_amount, 'item_name', product_item.product_name);
            END IF;
        END IF;

        -- Inventory Movement
        SELECT cost_price INTO product_cost FROM public.branch_products bp WHERE bp.product_id = product_item.product_id AND bp.branch_id = attention_rec.branch_id;
        PERFORM public.create_product_movement(attention_rec.tenant_id, attention_rec.branch_id, product_item.product_id, 'SALE'::text, -product_item.quantity, product_cost, sale_id_new, 'SALE'::text);
    END LOOP;

    -- NOTE: Commission logic for items inside combos is omitted for this version for simplicity.

    -- Step 5: Calculate and update final totals
    SELECT COALESCE(SUM(total_price), 0), COALESCE(SUM(subtotal_price), 0), COALESCE(SUM(total_tax_amount), 0)
    INTO total_amt, total_subtotal_amt, total_tax_amt
    FROM public.sales_items WHERE sale_id = sale_id_new;

    UPDATE public.sales SET total_amount = total_amt, subtotal_amount = total_subtotal_amt, total_tax_amount = total_tax_amt
    WHERE id = sale_id_new;

    -- Step 6: Enqueue client notifications (unchanged from V8)
    BEGIN
        PERFORM public.queue_client_email(attention_rec.tenant_id, attention_rec.client_id, 'payment_receipt', '{}'::jsonb);
    EXCEPTION WHEN others THEN RAISE WARNING 'V9: Failed to queue client receipt email for attention_id %: %', p_attention_id, SQLERRM;
    END;
    BEGIN
        PERFORM public.queue_client_whatsapp(attention_rec.tenant_id, attention_rec.client_id, 'payment_receipt_whatsapp', '{}'::jsonb);
    EXCEPTION WHEN others THEN RAISE WARNING 'V9: Failed to queue client receipt WhatsApp for attention_id %: %', p_attention_id, SQLERRM;
    END;

    -- Step 7: Return the final JSON object
    RETURN jsonb_build_object(
        'saleId', sale_id_new,
        'commissions', v_commissions_array
    );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.process_sale_from_attention IS 'V9: Calculates and records staff commissions, and returns them along with the saleId.';

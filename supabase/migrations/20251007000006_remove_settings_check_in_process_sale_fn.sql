-- V6 of the function, removing the conditional checks based on tenant settings.
-- The creation of sale items should always happen.
CREATE OR REPLACE FUNCTION public.process_sale_from_attention(
    p_attention_id uuid
)
RETURNS uuid AS $$ -- Returns the new sale_id
DECLARE
    attention_rec RECORD;
    sale_id_new uuid;
    sale_number_new text;
    combo_item RECORD;
    service_item RECORD;
    product_item RECORD;
    combo_parent_id uuid;
    total_subtotal_amt numeric;
    total_tax_amt numeric;
    total_amt numeric;
    product_cost numeric;
BEGIN
    -- Step 1: Fetch attention details
    SELECT * INTO attention_rec FROM public.attentions WHERE id = p_attention_id;

    -- Step 2: Get the next sale number
    sale_number_new := public.get_next_document_number(
        p_tenant_id := attention_rec.tenant_id,
        p_document_type := 'SALE'::text,
        p_branch_id := attention_rec.branch_id
    );

    -- Step 3: Create the main 'sales' record
    INSERT INTO public.sales (tenant_id, branch_id, client_id, attention_id, sale_number, sale_date, subtotal_amount, total_tax_amount, total_amount, status)
    VALUES (attention_rec.tenant_id, attention_rec.branch_id, attention_rec.client_id, p_attention_id, sale_number_new, now(), 0, 0, 0, 'COMPLETED')
    RETURNING id INTO sale_id_new;

    -- Step 4: Process and insert sale items
    
    -- Process Combos
    FOR combo_item IN
        SELECT ac.id as attention_combo_id, c.name as combo_name, ac.quantity
        FROM public.attention_combos ac
        JOIN public.combos c ON ac.combo_id = c.id
        WHERE ac.attention_id = p_attention_id
    LOOP
        INSERT INTO public.sales_items (sale_id, item_type, description, quantity, unit_price, subtotal_price, total_tax_amount, total_price)
        VALUES (sale_id_new, 'COMBO', combo_item.combo_name, combo_item.quantity, 0, 0, 0, 0)
        RETURNING id INTO combo_parent_id;

        -- Process services within the combo
        FOR service_item IN
            SELECT s.name as service_name, s.id as service_id, ats.service_price
            FROM public.attention_services ats
            JOIN public.services s ON ats.service_id = s.id
            WHERE ats.attention_id = p_attention_id AND ats.combo_id = combo_item.attention_combo_id
        LOOP
            INSERT INTO public.sales_items (sale_id, parent_item_id, item_type, service_id, description, quantity, unit_price, subtotal_price, total_tax_amount, total_price)
            VALUES (sale_id_new, combo_parent_id, 'SERVICE', service_item.service_id, service_item.service_name, 1, service_item.service_price, service_item.service_price, 0, service_item.service_price);
        END LOOP;

        -- Process products within the combo
        FOR product_item IN
            SELECT p.name as product_name, p.id as product_id, atp.unit_price, atp.quantity
            FROM public.attention_products atp
            JOIN public.products p ON atp.product_id = p.id
            WHERE atp.attention_id = p_attention_id AND atp.combo_id = combo_item.attention_combo_id
        LOOP
            INSERT INTO public.sales_items (sale_id, parent_item_id, item_type, product_id, description, quantity, unit_price, subtotal_price, total_tax_amount, total_price)
            VALUES (sale_id_new, combo_parent_id, 'PRODUCT', product_item.product_id, product_item.product_name, product_item.quantity, product_item.unit_price, product_item.unit_price * product_item.quantity, 0, product_item.unit_price * product_item.quantity);
            
            SELECT cost_price INTO product_cost FROM public.branch_products bp WHERE bp.product_id = product_item.product_id AND bp.branch_id = attention_rec.branch_id;
            PERFORM public.create_product_movement(attention_rec.tenant_id, attention_rec.branch_id, product_item.product_id, 'SALE'::text, -product_item.quantity, product_cost, sale_id_new, 'SALE'::text);
        END LOOP;
    END LOOP;

    -- Process standalone services
    FOR service_item IN
        SELECT s.name as service_name, s.id as service_id, ats.service_price
        FROM public.attention_services ats
        JOIN public.services s ON ats.service_id = s.id
        WHERE ats.attention_id = p_attention_id AND ats.combo_id IS NULL
    LOOP
        INSERT INTO public.sales_items (sale_id, item_type, service_id, description, quantity, unit_price, subtotal_price, total_tax_amount, total_price)
        VALUES (sale_id_new, 'SERVICE', service_item.service_id, service_item.service_name, 1, service_item.service_price, service_item.service_price, 0, service_item.service_price);
    END LOOP;

    -- Process standalone products
    FOR product_item IN
        SELECT p.name as product_name, p.id as product_id, atp.unit_price, atp.quantity
        FROM public.attention_products atp
        JOIN public.products p ON atp.product_id = p.id
        WHERE atp.attention_id = p_attention_id AND atp.combo_id IS NULL
    LOOP
        INSERT INTO public.sales_items (sale_id, item_type, product_id, description, quantity, unit_price, subtotal_price, total_tax_amount, total_price)
        VALUES (sale_id_new, 'PRODUCT', product_item.product_id, product_item.product_name, product_item.quantity, product_item.unit_price, product_item.unit_price * product_item.quantity, 0, product_item.unit_price * product_item.quantity);

        SELECT cost_price INTO product_cost FROM public.branch_products bp WHERE bp.product_id = product_item.product_id AND bp.branch_id = attention_rec.branch_id;
        PERFORM public.create_product_movement(attention_rec.tenant_id, attention_rec.branch_id, product_item.product_id, 'SALE'::text, -product_item.quantity, product_cost, sale_id_new, 'SALE'::text);
    END LOOP;

    -- Step 5: Calculate final totals
    SELECT
        COALESCE(SUM(subtotal_price), 0),
        COALESCE(SUM(total_tax_amount), 0),
        COALESCE(SUM(total_price), 0)
    INTO
        total_subtotal_amt,
        total_tax_amt,
        total_amt
    FROM public.sales_items
    WHERE sale_id = sale_id_new;

    -- Step 6: Update the main 'sales' record
    UPDATE public.sales
    SET
        subtotal_amount = total_subtotal_amt,
        total_tax_amount = total_tax_amt,
        total_amount = total_amt
    WHERE id = sale_id_new;

    -- Step 7: Return the ID
    RETURN sale_id_new;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.process_sale_from_attention IS 'V6: Remove conditional item creation based on tenant settings. Sale items are now always created.';


-- MIGRATION: Fix NOT NULL constraint violation in generate_invoice_for_attention

-- Recreate the function to provide all required columns for the invoices table.
CREATE OR REPLACE FUNCTION public.generate_invoice_for_attention(
    p_attention_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_invoice_id UUID;
    v_attention RECORD;
    v_tenant_id UUID;
    v_client_id UUID;
    v_branch_id UUID;
    v_invoice_item_id UUID;
    v_service RECORD;
    v_product RECORD;
    v_subtotal NUMERIC := 0;
    v_total_tax NUMERIC := 0;
    v_currency_id UUID;
BEGIN
    -- Get attention details
    SELECT * INTO v_attention FROM public.attentions WHERE id = p_attention_id;
    v_tenant_id := v_attention.tenant_id;
    v_client_id := v_attention.client_id;
    v_branch_id := v_attention.branch_id;

    -- Check if an invoice already exists for this attention
    SELECT id INTO v_invoice_id FROM public.invoices WHERE attention_id = p_attention_id;
    IF v_invoice_id IS NOT NULL THEN
        RETURN v_invoice_id;
    END IF;

    -- Get default currency from tenant
    SELECT default_currency_id INTO v_currency_id FROM public.tenants WHERE id = v_tenant_id;
    IF v_currency_id IS NULL THEN
        RAISE EXCEPTION 'Tenant % does not have a default_currency_id set.', v_tenant_id;
    END IF;

    -- Create invoice header
    INSERT INTO public.invoices (
        tenant_id,
        billed_to_client_id,
        attention_id,
        invoice_number,
        status,
        subtotal_amount,
        total_tax_amount,
        total_amount,
        issue_date,
        due_date,
        currency_id
    ) VALUES (
        v_tenant_id,
        v_client_id,
        p_attention_id,
        'INV-' || to_char(CURRENT_DATE, 'YYYYMMDD') || '-' || (SELECT count(*) + 1 FROM invoices WHERE tenant_id = v_tenant_id),
        'paid',
        0,
        0,
        v_attention.total_amount,
        CURRENT_DATE,
        CURRENT_DATE,
        v_currency_id
    ) RETURNING id INTO v_invoice_id;

    -- Create invoice items for services
    FOR v_service IN
        SELECT * FROM public.attention_services WHERE attention_id = p_attention_id
    LOOP
        INSERT INTO public.invoice_items (
            invoice_id,
            service_id,
            item_type,
            description,
            quantity,
            unit_price,
            total_price
        ) VALUES (
            v_invoice_id,
            v_service.service_id,
            'SERVICE',
            (SELECT name FROM public.services WHERE id = v_service.service_id),
            1,
            v_service.price,
            v_service.price
        ) RETURNING total_price INTO v_subtotal;

        v_subtotal := v_subtotal + v_service.price;
    END LOOP;

    -- Create invoice items for products
    FOR v_product IN
        SELECT * FROM public.attention_products WHERE attention_id = p_attention_id
    LOOP
        INSERT INTO public.invoice_items (
            invoice_id,
            product_id,
            item_type,
            description,
            quantity,
            unit_price,
            total_price
        ) VALUES (
            v_invoice_id,
            v_product.product_id,
            'PRODUCT',
            (SELECT name FROM public.products WHERE id = v_product.product_id),
            v_product.quantity,
            v_product.price,
            v_product.price * v_product.quantity
        ) RETURNING total_price INTO v_subtotal;

        v_subtotal := v_subtotal + (v_product.price * v_product.quantity);
    END LOOP;

    -- Update invoice with total amounts
    UPDATE public.invoices
    SET
        subtotal_amount = v_subtotal,
        total_tax_amount = v_total_tax, -- Tax logic still pending
        total_amount = v_subtotal + v_total_tax
    WHERE id = v_invoice_id;

    RETURN v_invoice_id;
END;
$$;

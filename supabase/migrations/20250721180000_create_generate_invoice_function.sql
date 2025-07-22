-- Fase 2: Lógica de Negocio - Crear la Función de Facturación

CREATE OR REPLACE FUNCTION public.generate_invoice_for_subscription(
    p_subscription_id UUID
)
RETURNS UUID -- Devuelve el ID de la nueva factura creada
LANGUAGE plpgsql
AS $$
DECLARE
    v_tenant_id UUID;
    v_branch_id UUID;
    v_plan_id UUID;
    v_country_id UUID;
    v_currency_id UUID;
    v_invoice_id UUID;
    v_invoice_item_id UUID;
    v_calculated_price NUMERIC;
    v_calculated_extra_branch_price NUMERIC;
    v_plan_name TEXT;
    v_description TEXT;
    v_subtotal NUMERIC := 0;
    v_total_taxes NUMERIC := 0;
    v_tax_record RECORD;
BEGIN
    -- 1. Obtener datos de la suscripción y del tenant
    SELECT
        ts.tenant_id, ts.branch_id, ts.subscription_plan_id, t.country_id, t.default_currency_id
    INTO
        v_tenant_id, v_branch_id, v_plan_id, v_country_id, v_currency_id
    FROM public.tenant_subscriptions ts
    JOIN public.tenants t ON ts.tenant_id = t.id
    WHERE ts.id = p_subscription_id;

    IF v_tenant_id IS NULL THEN
        RAISE EXCEPTION 'Suscripción con ID % no encontrada.', p_subscription_id;
    END IF;

    -- 2. Obtener el precio calculado para el plan y país específicos
    -- Reutilizamos la lógica de la función get_calculated_plan_prices
    SELECT
        gcp.plan_name,
        gcp.calculated_price,
        gcp.calculated_extra_branch_price
    INTO
        v_plan_name,
        v_calculated_price,
        v_calculated_extra_branch_price
    FROM public.get_calculated_plan_prices() gcp
    WHERE gcp.plan_id = v_plan_id AND gcp.country_id = v_country_id
    LIMIT 1;

    IF v_calculated_price IS NULL THEN
        RAISE EXCEPTION 'No se pudo calcular el precio para el plan ID % y país ID %.', v_plan_id, v_country_id;
    END IF;

    -- 3. Crear la cabecera de la factura (con totales iniciales en 0)
    INSERT INTO public.invoices (
        tenant_id, billed_to_tenant_id, issue_date, due_date,
        subtotal_amount, total_tax_amount, total_amount, currency_id,
        invoice_number, status
    ) VALUES (
        '00000000-0000-0000-0000-000000000000', -- Factura emitida por el superadmin
        v_tenant_id,
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '1 month',
        0, 0, 0,
        v_currency_id,
        'INV-' || to_char(CURRENT_DATE, 'YYYYMMDD') || '-' || (SELECT count(*) + 1 FROM invoices),
        'draft'
    ) RETURNING id INTO v_invoice_id;

    -- 4. Crear el item de la factura para la suscripción
    v_description := 'Suscripción Plan: ' || v_plan_name;
    v_subtotal := v_calculated_price;

    INSERT INTO public.invoice_items (
        invoice_id, subscription_plan_id, item_type, description, quantity, unit_price, total_price
    ) VALUES (
        v_invoice_id, v_plan_id, 'SUBSCRIPTION_PLAN', v_description, 1, v_calculated_price, v_subtotal
    ) RETURNING id INTO v_invoice_item_id;

    -- 5. Calcular y aplicar impuestos para este item
    FOR v_tax_record IN
        SELECT id, rate FROM public.generic_taxes WHERE country_id = v_country_id AND is_active = TRUE
    LOOP
        DECLARE
            v_tax_amount NUMERIC;
        BEGIN
            v_tax_amount := v_subtotal * (v_tax_record.rate / 100);
            v_total_taxes := v_total_taxes + v_tax_amount;

            INSERT INTO public.invoice_item_taxes (
                invoice_item_id, tax_id, taxable_amount, calculated_tax_amount
            ) VALUES (
                v_invoice_item_id, v_tax_record.id, v_subtotal, v_tax_amount
            );
        END;
    END LOOP;

    -- 6. Actualizar la factura con los totales finales
    UPDATE public.invoices
    SET
        subtotal_amount = v_subtotal,
        total_tax_amount = v_total_taxes,
        total_amount = v_subtotal + v_total_taxes
    WHERE id = v_invoice_id;

    -- 7. Devolver el ID de la factura creada
    RETURN v_invoice_id;
END;
$$;

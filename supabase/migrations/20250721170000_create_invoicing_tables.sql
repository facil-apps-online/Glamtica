-- Fase 1: Arquitectura de Facturación Universal
-- Creamos las tablas necesarias para un sistema de facturación robusto y multi-tenant.

-- Tabla 0: generic_taxes
-- Almacena las definiciones de los impuestos que se pueden aplicar.
CREATE TABLE public.generic_taxes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    rate NUMERIC(5, 2) NOT NULL,
    country_id UUID NOT NULL REFERENCES countries(id),
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_tax_per_country UNIQUE (name, country_id)
);

COMMENT ON TABLE public.generic_taxes IS 'Definiciones de impuestos aplicables por país.';
COMMENT ON COLUMN public.generic_taxes.rate IS 'Tasa de impuesto en porcentaje (ej. 19.00 para 19%).';


-- Tabla 1: invoices
-- Almacena la cabecera de cada factura. Contiene totales denormalizados por rendimiento.
CREATE TABLE public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    billed_to_tenant_id UUID NULL REFERENCES tenants(id),
    billed_to_client_id UUID NULL REFERENCES clients(id),
    invoice_number TEXT NOT NULL,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    subtotal_amount NUMERIC(12, 2) NOT NULL,
    total_tax_amount NUMERIC(12, 2) NOT NULL,
    total_amount NUMERIC(12, 2) NOT NULL,
    currency_id UUID NOT NULL REFERENCES currencies(id),
    status TEXT NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT check_billed_to_target CHECK (
        (billed_to_tenant_id IS NOT NULL AND billed_to_client_id IS NULL) OR
        (billed_to_tenant_id IS NULL AND billed_to_client_id IS NOT NULL)
    ),
    CONSTRAINT unique_invoice_per_tenant UNIQUE (tenant_id, invoice_number)
);

COMMENT ON TABLE public.invoices IS 'Cabeceras de facturas para superadmin y tenants.';
COMMENT ON COLUMN public.invoices.tenant_id IS 'El tenant que emite la factura.';
COMMENT ON COLUMN public.invoices.billed_to_tenant_id IS 'El tenant al que se le factura (si aplica).';
COMMENT ON COLUMN public.invoices.billed_to_client_id IS 'El cliente final al que se le factura (si aplica).';
COMMENT ON COLUMN public.invoices.subtotal_amount IS 'Suma de los items antes de impuestos.';
COMMENT ON COLUMN public.invoices.total_tax_amount IS 'Suma de todos los impuestos aplicados.';
COMMENT ON COLUMN public.invoices.total_amount IS 'Suma del subtotal y los impuestos.';


-- Tabla 2: invoice_items
-- Almacena cada línea de detalle de una factura. Es polimórfica.
CREATE TABLE public.invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    product_id UUID NULL REFERENCES products(id),
    subscription_plan_id UUID NULL REFERENCES subscription_plans(id),
    item_type TEXT NOT NULL,
    description TEXT NOT NULL,
    quantity INT NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL,
    total_price NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT check_item_source CHECK (
        (item_type = 'PRODUCT' AND product_id IS NOT NULL AND subscription_plan_id IS NULL) OR
        (item_type = 'SUBSCRIPTION_PLAN' AND product_id IS NULL AND subscription_plan_id IS NOT NULL)
    )
);

COMMENT ON TABLE public.invoice_items IS 'Items polimórficos de una factura (productos o suscripciones).';
COMMENT ON COLUMN public.invoice_items.item_type IS 'Tipo de item: PRODUCT o SUBSCRIPTION_PLAN.';


-- Tabla 3: invoice_item_taxes
-- Almacena cada impuesto aplicado a una línea de factura específica.
CREATE TABLE public.invoice_item_taxes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_item_id UUID NOT NULL REFERENCES invoice_items(id) ON DELETE CASCADE,
    tax_id UUID NOT NULL REFERENCES generic_taxes(id),
    taxable_amount NUMERIC(12, 2) NOT NULL,
    calculated_tax_amount NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.invoice_item_taxes IS 'Impuestos aplicados a cada item de una factura.';
COMMENT ON COLUMN public.invoice_item_taxes.tax_id IS 'Referencia al impuesto genérico aplicado.';
COMMENT ON COLUMN public.invoice_item_taxes.taxable_amount IS 'Monto del item al que se aplica el impuesto.';
COMMENT ON COLUMN public.invoice_item_taxes.calculated_tax_amount IS 'Monto del impuesto calculado.';
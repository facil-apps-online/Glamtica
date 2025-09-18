CREATE TABLE public.sales (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id),
    branch_id uuid NOT NULL REFERENCES branches(id),
    client_id uuid REFERENCES clients(id),
    attention_id uuid REFERENCES attentions(id),
    sale_number text NOT NULL,
    sale_date timestamptz NOT NULL DEFAULT now(),
    subtotal_amount numeric(12, 2) NOT NULL,
    total_tax_amount numeric(12, 2) NOT NULL,
    total_amount numeric(12, 2) NOT NULL,
    status text NOT NULL DEFAULT 'COMPLETED', -- 'COMPLETED', 'RETURNED', 'CANCELLED'
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.sales_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id uuid NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    parent_item_id uuid REFERENCES sales_items(id) ON DELETE CASCADE, -- Para jerarquía de combos
    item_type text NOT NULL, -- 'PRODUCT', 'SERVICE', 'COMBO'
    product_id uuid REFERENCES products(id),
    service_id uuid REFERENCES services(id),
    description text NOT NULL,
    quantity numeric NOT NULL,
    unit_price numeric(12, 2) NOT NULL,
    subtotal_price numeric(12, 2) NOT NULL,
    tax_details jsonb, -- [{'name': 'IVA', 'rate': 0.19, 'amount': 19.00}]
    total_tax_amount numeric(12, 2) NOT NULL,
    total_price numeric(12, 2) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

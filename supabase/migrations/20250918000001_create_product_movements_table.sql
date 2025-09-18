CREATE TABLE public.product_movements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id),
    branch_id uuid NOT NULL REFERENCES branches(id),
    product_id uuid NOT NULL REFERENCES products(id),
    movement_date timestamptz NOT NULL DEFAULT now(),
    movement_type text NOT NULL, -- 'SALE', 'PURCHASE', 'TRANSFER_IN', 'TRANSFER_OUT', 'ADJUSTMENT'
    quantity_change numeric NOT NULL,
    cost_of_change numeric NOT NULL,
    stock_after_movement numeric NOT NULL,
    cost_after_movement numeric NOT NULL, -- Costo promedio ponderado
    reference_id uuid,
    reference_type text,
    created_at timestamptz NOT NULL DEFAULT now()
);

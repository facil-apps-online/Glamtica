CREATE TABLE product_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    from_branch_id UUID NOT NULL REFERENCES branches(id),
    to_branch_id UUID NOT NULL REFERENCES branches(id),
    transfer_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    status TEXT NOT NULL CHECK (status IN ('en_proceso', 'en_transito', 'completado', 'cancelado')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE product_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access to own product transfers"
ON product_transfers
FOR ALL
USING (tenant_id = (auth.jwt()->>'tenant_id')::uuid);

CREATE TABLE product_transfer_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_id UUID NOT NULL REFERENCES product_transfers(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE product_transfer_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access to own product transfer items"
ON product_transfer_items
FOR ALL
USING (exists(select 1 from product_transfers where product_transfers.id = transfer_id and product_transfers.tenant_id = (auth.jwt()->>'tenant_id')::uuid));

CREATE TABLE public.purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
    purchase_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    total_amount NUMERIC(10, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add RLS
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenants can manage their own purchases"
    ON public.purchases FOR ALL
    USING (tenant_id = (SELECT auth.jwt()->>'tenant_id')::uuid);
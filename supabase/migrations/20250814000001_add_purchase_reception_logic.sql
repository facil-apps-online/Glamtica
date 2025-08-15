-- 1. Add payment_status to purchases table
ALTER TABLE public.purchases
ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'no_pagado';

-- 2. Add reception_notes to purchases table
ALTER TABLE public.purchases
ADD COLUMN reception_notes TEXT;

-- 3. Create purchase_item_receptions table
CREATE TABLE public.purchase_item_receptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_item_id UUID NOT NULL REFERENCES public.purchase_items(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    quantity_expected INTEGER NOT NULL,
    quantity_received INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add RLS to the new table
ALTER TABLE public.purchase_item_receptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow full access to own tenant receptions"
ON public.purchase_item_receptions
FOR ALL
USING (auth.uid() IS NOT NULL AND tenant_id = (SELECT current_setting('app.current_tenant_id'))::uuid);

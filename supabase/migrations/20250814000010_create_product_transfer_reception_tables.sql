-- Tabla para registrar la cabecera de una recepción de traslado
CREATE TABLE public.product_transfer_receptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_id UUID NOT NULL REFERENCES public.product_transfers(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    reception_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_transfer FOREIGN KEY (transfer_id) REFERENCES public.product_transfers(id),
    CONSTRAINT fk_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(id)
);

ALTER TABLE public.product_transfer_receptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir acceso total a las recepciones de traslados del propio tenant"
ON public.product_transfer_receptions
FOR ALL
USING (tenant_id = (auth.jwt()->>'tenant_id')::uuid);

-- Tabla para registrar el detalle de cada item en la recepción
CREATE TABLE public.product_transfer_reception_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reception_id UUID NOT NULL REFERENCES public.product_transfer_receptions(id) ON DELETE CASCADE,
    transfer_item_id UUID NOT NULL REFERENCES public.product_transfer_items(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id),
    quantity_expected INTEGER NOT NULL,
    quantity_received INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_reception FOREIGN KEY (reception_id) REFERENCES public.product_transfer_receptions(id),
    CONSTRAINT fk_transfer_item FOREIGN KEY (transfer_item_id) REFERENCES public.product_transfer_items(id),
    CONSTRAINT fk_product FOREIGN KEY (product_id) REFERENCES public.products(id)
);

ALTER TABLE public.product_transfer_reception_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir acceso total a los items de recepciones de traslados del propio tenant"
ON public.product_transfer_reception_items
FOR ALL
USING (EXISTS (
    SELECT 1
    FROM public.product_transfer_receptions r
    WHERE r.id = reception_id AND r.tenant_id = (auth.jwt()->>'tenant_id')::uuid
));

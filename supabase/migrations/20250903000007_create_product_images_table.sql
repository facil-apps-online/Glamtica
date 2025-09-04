CREATE TABLE public.product_images (
    id UUID DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT false NOT NULL,
    sort_order INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX idx_product_images_product_id ON public.product_images(product_id);
CREATE INDEX idx_product_images_tenant_id ON public.product_images(tenant_id);

-- RLS Policies
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to users of the same tenant"
ON public.product_images
FOR SELECT
USING (tenant_id = (SELECT (auth.jwt() ->> 'app_metadata')::jsonb ->> 'tenant_id')::uuid);

CREATE POLICY "Allow insert access to users of the same tenant"
ON public.product_images
FOR INSERT
WITH CHECK (tenant_id = (SELECT (auth.jwt() ->> 'app_metadata')::jsonb ->> 'tenant_id')::uuid);

CREATE POLICY "Allow update access to users of the same tenant"
ON public.product_images
FOR UPDATE
USING (tenant_id = (SELECT (auth.jwt() ->> 'app_metadata')::jsonb ->> 'tenant_id')::uuid);

CREATE POLICY "Allow delete access to users of the same tenant"
ON public.product_images
FOR DELETE
USING (tenant_id = (SELECT (auth.jwt() ->> 'app_metadata')::jsonb ->> 'tenant_id')::uuid);

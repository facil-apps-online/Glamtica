CREATE TABLE public.equipment_brands (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    tenant_id uuid NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.equipment_brands OWNER TO postgres;

ALTER TABLE ONLY public.equipment_brands
    ADD CONSTRAINT equipment_brands_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.equipment_brands
    ADD CONSTRAINT equipment_brands_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

-- RLS Policies
ALTER TABLE public.equipment_brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access to own tenants"
ON public.equipment_brands
AS PERMISSIVE
FOR ALL
TO authenticated
USING (
  (get_my_claim('tenant_id'::text)) = tenant_id
)
WITH CHECK (
  (get_my_claim('tenant_id'::text)) = tenant_id
);
ALTER TABLE public.product_brands DROP CONSTRAINT brands_name_key;
ALTER TABLE public.product_brands ADD CONSTRAINT product_brands_tenant_id_name_key UNIQUE (tenant_id, name);
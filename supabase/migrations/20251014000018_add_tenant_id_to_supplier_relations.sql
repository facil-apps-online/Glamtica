ALTER TABLE public.supplier_contacts
ADD COLUMN tenant_id uuid NOT NULL;

ALTER TABLE public.supplier_addresses
ADD COLUMN tenant_id uuid NOT NULL;

ALTER TABLE public.supplier_contacts
ADD CONSTRAINT supplier_contacts_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

ALTER TABLE public.supplier_addresses
ADD CONSTRAINT supplier_addresses_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
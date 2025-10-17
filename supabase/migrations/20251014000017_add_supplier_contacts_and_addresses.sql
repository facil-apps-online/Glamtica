CREATE TABLE public.supplier_contacts (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    supplier_id uuid NOT NULL,
    contact_type text NOT NULL,
    name text NOT NULL,
    email text,
    phone text,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT supplier_contacts_pkey PRIMARY KEY (id),
    CONSTRAINT supplier_contacts_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE CASCADE
);

CREATE TABLE public.supplier_addresses (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    supplier_id uuid NOT NULL,
    address_line_1 text,
    address_line_2 text,
    city text,
    state text,
    postal_code text,
    country text,
    latitude float8,
    longitude float8,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT supplier_addresses_pkey PRIMARY KEY (id),
    CONSTRAINT supplier_addresses_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE CASCADE
);

ALTER TABLE public.supplier_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_addresses ENABLE ROW LEVEL SECURITY;
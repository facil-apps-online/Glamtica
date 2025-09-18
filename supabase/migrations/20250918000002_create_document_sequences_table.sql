CREATE TABLE public.document_sequences (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id),
    branch_id uuid REFERENCES branches(id), -- Nulo si es para todo el tenant
    name text NOT NULL,
    document_type text NOT NULL, -- 'SALE', 'INVOICE', 'CREDIT_NOTE', 'TRANSFER'
    prefix text,
    current_number integer NOT NULL DEFAULT 1,
    padding integer NOT NULL DEFAULT 7, -- Ceros a la izquierda
    is_active boolean NOT NULL DEFAULT true,
    country_specific_data jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);


CREATE TABLE public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow full access to own payment methods" ON public.payment_methods FOR ALL USING (auth.uid() IN (SELECT user_id FROM public.user_assignments WHERE tenant_id = public.payment_methods.tenant_id));

create table public.attention_payments (
  id uuid not null default gen_random_uuid (),
  attention_id uuid not null,
  payment_method_id uuid not null,
  amount numeric not null,
  status text not null,
  transaction_id text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  tenant_id uuid null,
  constraint attention_payments_pkey primary key (id),
  constraint attention_payments_attention_id_fkey foreign KEY (attention_id) references attentions (id) on delete CASCADE,
  constraint attention_payments_payment_method_id_fkey foreign KEY (payment_method_id) references payment_methods (id) on delete RESTRICT,
  constraint attention_payments_tenant_id_fkey foreign KEY (tenant_id) references tenants (id) on delete CASCADE
) TABLESPACE pg_default;

ALTER TABLE public.attention_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow full access to own attention payments" ON public.attention_payments FOR ALL USING (auth.uid() IN (SELECT user_id FROM public.user_assignments WHERE tenant_id = public.attention_payments.tenant_id));

-- Insert default payment methods
INSERT INTO public.payment_methods (name, tenant_id) 
SELECT 'Efectivo', id FROM public.tenants;

INSERT INTO public.payment_methods (name, tenant_id) 
SELECT 'Wompi', id FROM public.tenants;

INSERT INTO public.payment_methods (name, tenant_id) 
SELECT 'Transferencia', id FROM public.tenants;

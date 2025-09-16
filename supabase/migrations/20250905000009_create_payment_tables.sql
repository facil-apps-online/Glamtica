
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

CREATE TABLE public.attention_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attention_id UUID NOT NULL REFERENCES public.attentions(id) ON DELETE CASCADE,
  payment_method_id UUID NOT NULL REFERENCES public.payment_methods(id) ON DELETE RESTRICT,
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL, -- e.g., 'completed', 'pending', 'failed'
  transaction_id TEXT, -- For external payment gateways
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE
);

ALTER TABLE public.attention_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow full access to own attention payments" ON public.attention_payments FOR ALL USING (auth.uid() IN (SELECT user_id FROM public.user_assignments WHERE tenant_id = public.attention_payments.tenant_id));

-- Insert default payment methods
INSERT INTO public.payment_methods (name, tenant_id) 
SELECT 'Efectivo', id FROM public.tenants;

INSERT INTO public.payment_methods (name, tenant_id) 
SELECT 'Wompi', id FROM public.tenants;

INSERT INTO public.payment_methods (name, tenant_id) 
SELECT 'Transferencia', id FROM public.tenants;

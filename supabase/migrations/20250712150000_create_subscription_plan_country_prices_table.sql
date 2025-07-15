
CREATE TABLE public.subscription_plan_country_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_plan_id UUID NOT NULL REFERENCES public.subscription_plans(id) ON DELETE CASCADE,
    country_id UUID NOT NULL REFERENCES public.countries(id) ON DELETE CASCADE,
    price NUMERIC NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(subscription_plan_id, country_id)
);

ALTER TABLE public.subscription_plan_country_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.subscription_plan_country_prices FOR SELECT USING (true);


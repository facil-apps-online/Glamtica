-- Add the active_plan_id column to the tenant_subscriptions table.
-- This column will store a reference to the subscription_plans table.
ALTER TABLE public.tenant_subscriptions
ADD COLUMN active_plan_id UUID;

-- Add a foreign key constraint to ensure the active_plan_id refers to a valid plan.
ALTER TABLE public.tenant_subscriptions
ADD CONSTRAINT fk_active_plan
FOREIGN KEY (active_plan_id)
REFERENCES public.subscription_plans(id)
ON DELETE SET NULL; -- If a plan is deleted, set the reference to NULL to avoid breaking subscriptions.

-- Add an index for better performance on lookups.
CREATE INDEX idx_tenant_subscriptions_active_plan_id ON public.tenant_subscriptions(active_plan_id);

COMMENT ON COLUMN public.tenant_subscriptions.active_plan_id IS 'The specific subscription plan that is currently active for this subscription period.';

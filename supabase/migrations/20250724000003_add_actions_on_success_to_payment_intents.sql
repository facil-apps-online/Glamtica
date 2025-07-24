-- MIGRATION: Add actions_on_success to payment_intents for generic payment flow

ALTER TABLE public.payment_intents
ADD COLUMN actions_on_success JSONB;

COMMENT ON COLUMN public.payment_intents.actions_on_success IS 'Array of actions to be executed upon successful payment. E.g., [{"action_type": "ACTIVATE_BRANCHES", "payload": {...}}]';

-- Retroactively update existing intents if necessary (example)
-- This part is commented out as it depends on business logic for past intents.
-- UPDATE public.payment_intents
-- SET actions_on_success = jsonb_build_array(
--   jsonb_build_object(
--     'action_type', 'ACTIVATE_SUBSCRIPTION',
--     'payload', metadata - 'type' -- Example of moving data from metadata to the new structure
--   )
-- )
-- WHERE metadata->>'type' = 'SUBSCRIPTION_PAYMENT' AND actions_on_success IS NULL;

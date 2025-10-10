-- Adds a unique, non-null confirmation_token to the attentions table.
-- This token will be used for public-facing actions like confirming or
-- cancelling an appointment via an email link, providing a secure way
-- to authorize the action without exposing a primary ID or requiring a login.
ALTER TABLE public.attentions
ADD COLUMN confirmation_token UUID DEFAULT gen_random_uuid() NOT NULL;

-- Add an index to efficiently look up attentions by their confirmation token.
CREATE INDEX idx_attentions_confirmation_token ON public.attentions(confirmation_token);
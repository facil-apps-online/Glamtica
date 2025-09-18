-- 1. Drop the old, restrictive constraint
ALTER TABLE public.invoice_items DROP CONSTRAINT check_item_source;

-- 2. Add columns for services and hierarchy
ALTER TABLE public.invoice_items ADD COLUMN service_id uuid null;
ALTER TABLE public.invoice_items ADD COLUMN parent_item_id uuid null;

-- 3. Add foreign key constraints for the new columns
ALTER TABLE public.invoice_items ADD CONSTRAINT invoice_items_service_id_fkey FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL;
ALTER TABLE public.invoice_items ADD CONSTRAINT invoice_items_parent_item_id_fkey FOREIGN KEY (parent_item_id) REFERENCES invoice_items(id) ON DELETE CASCADE;

-- 4. Add a new, more flexible check constraint
ALTER TABLE public.invoice_items ADD CONSTRAINT check_item_source_v2 CHECK (
    (item_type = 'PRODUCT' AND product_id IS NOT NULL AND service_id IS NULL) OR
    (item_type = 'SERVICE' AND service_id IS NOT NULL AND product_id IS NULL) OR
    -- A combo is a conceptual entry, it doesn't link to a specific product or service ID itself.
    (item_type = 'COMBO' AND product_id IS NULL AND service_id IS NULL) OR
    -- Allow for custom line items that are just descriptions
    (item_type = 'CUSTOM' AND product_id IS NULL AND service_id IS NULL) OR
    -- Keep the original logic for SUBSCRIPTION_PLAN to not break other functionalities
    (item_type = 'SUBSCRIPTION_PLAN' AND subscription_plan_id IS NOT NULL AND product_id IS NULL AND service_id IS NULL)
);

-- Add a comment for clarity
COMMENT ON CONSTRAINT check_item_source_v2 ON public.invoice_items IS 'Validates that an invoice item has a valid type and corresponding ID. PRODUCT requires product_id, SERVICE requires service_id. COMBO and CUSTOM are for grouping or manual entries. SUBSCRIPTION_PLAN is for tenant billing.';

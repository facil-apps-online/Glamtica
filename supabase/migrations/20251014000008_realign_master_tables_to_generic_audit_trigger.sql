-- Migration to realign master tables (products, services) to use the generic audit trigger function.
-- This cleans up the specialized, incorrect functions and ensures consistency with the audit context system.
-- This version corrects the order of operations: dropping triggers before the functions they depend on.

-- Step 1: Drop the existing audit triggers from the products and services tables.
DROP TRIGGER IF EXISTS audit_products_master_changes ON public.products;
DROP TRIGGER IF EXISTS audit_products_changes ON public.products;

DROP TRIGGER IF EXISTS audit_services_master_changes ON public.services;
DROP TRIGGER IF EXISTS audit_services_changes ON public.services;

-- Step 2: Now that no objects depend on them, drop the specialized audit functions.
DROP FUNCTION IF EXISTS public.audit_master_products_function();
DROP FUNCTION IF EXISTS public.audit_master_services_function();

-- Step 3: Create the new triggers on products and services to use the single, correct, generic audit function.
-- Using a consistent naming convention for the new triggers.
CREATE TRIGGER audit_changes_on_products
AFTER INSERT OR UPDATE OR DELETE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

CREATE TRIGGER audit_changes_on_services
AFTER INSERT OR UPDATE OR DELETE ON public.services
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();
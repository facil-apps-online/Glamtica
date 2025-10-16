-- Migration to add an audit trigger to the suppliers table.

-- Step 1: Drop the existing audit triggers from the suppliers table if they exist.
DROP TRIGGER IF EXISTS audit_changes_on_suppliers ON public.suppliers;

-- Step 2: Create the new trigger on the suppliers table to use the generic audit function.
CREATE TRIGGER audit_changes_on_suppliers
AFTER INSERT OR UPDATE OR DELETE ON public.suppliers
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

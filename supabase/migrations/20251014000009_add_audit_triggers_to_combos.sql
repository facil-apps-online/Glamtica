-- This migration adds audit triggers to the `combos` and `combo_items` tables.
-- It aligns them with the generic audit system, ensuring that any changes are logged in `audit_logs`.

-- Step 1: Create the trigger for the `combos` table.
-- This trigger will fire after any insert, update, or delete operation on the `combos` table
-- and will execute the generic audit function to log the change.
CREATE TRIGGER audit_changes_on_combos
AFTER INSERT OR UPDATE OR DELETE ON public.combos
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Step 2: Create the trigger for the `combo_items` table.
-- This trigger will fire after any insert, update, or delete operation on the `combo_items` table
-- and will execute the generic audit function to log the change.
CREATE TRIGGER audit_changes_on_combo_items
AFTER INSERT OR UPDATE OR DELETE ON public.combo_items
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();
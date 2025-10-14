
-- This migration adds a debug trigger to the clients table.

-- Step 1: Create a trigger on the clients table to call the debug function.
CREATE TRIGGER debug_audit_trigger_clients
AFTER UPDATE ON public.clients
FOR EACH ROW EXECUTE FUNCTION public.debug_audit_context();

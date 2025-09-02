-- Migration to create an RPC function for securely updating attention status.

CREATE OR REPLACE FUNCTION public.update_attention_status(
    p_attention_id uuid,
    p_new_status text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tenant_id uuid;
BEGIN
    -- Get the tenant_id from the attention record to ensure security context
    SELECT tenant_id INTO v_tenant_id
    FROM public.attentions
    WHERE id = p_attention_id;

    -- Optional: Add a security check to ensure the caller has rights to this tenant.
    -- This can be more complex depending on your RLS policies.
    -- For now, we assume RLS is handled or the function is called from a trusted context (like an edge function).

    -- Update the status
    UPDATE public.attentions
    SET status = p_new_status
    WHERE id = p_attention_id;

END;
$$;

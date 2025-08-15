DROP FUNCTION IF EXISTS public.reject_product_transfer(uuid);

CREATE OR REPLACE FUNCTION public.reject_product_transfer(
    p_transfer_id uuid,
    p_tenant_id uuid,
    p_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    updated_transfer record;
    v_origin_branch_id uuid;
    v_user_is_in_origin_branch boolean;
BEGIN
    -- 1. Check if the transfer exists and get its origin branch
    SELECT origin_branch_id INTO v_origin_branch_id
    FROM public.product_transfers
    WHERE id = p_transfer_id AND tenant_id = p_tenant_id AND status = 'solicitado';

    IF v_origin_branch_id IS NULL THEN
        RAISE EXCEPTION 'Transfer not found, not in "solicitado" state, or you do not have permission.';
    END IF;

    -- 2. Check if the user is assigned to the origin branch
    SELECT EXISTS (
        SELECT 1
        FROM auth.users u,
             jsonb_array_elements(u.raw_app_meta_data->'assignments') as assignment
        WHERE u.id = p_user_id
          AND assignment->>'branch_id' = v_origin_branch_id::text
          AND assignment->>'tenant_id' = p_tenant_id::text
    ) INTO v_user_is_in_origin_branch;

    IF NOT v_user_is_in_origin_branch THEN
        RAISE EXCEPTION 'You do not have permission to reject this transfer.';
    END IF;

    -- 3. Update the transfer status to 'rechazado'
    UPDATE public.product_transfers
    SET status = 'rechazado', updated_at = now()
    WHERE id = p_transfer_id
    RETURNING * INTO updated_transfer;

    RETURN to_jsonb(updated_transfer);
END;
$$;

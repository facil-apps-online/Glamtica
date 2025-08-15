DROP FUNCTION IF EXISTS public.cancel_product_transfer(uuid);

CREATE OR REPLACE FUNCTION public.cancel_product_transfer(
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
    v_transfer_status text;
    v_origin_branch_id uuid;
    v_destination_branch_id uuid;
    v_user_can_cancel boolean;
BEGIN
    -- 1. Get transfer details
    SELECT status, origin_branch_id, destination_branch_id
    INTO v_transfer_status, v_origin_branch_id, v_destination_branch_id
    FROM public.product_transfers
    WHERE id = p_transfer_id AND tenant_id = p_tenant_id;

    IF v_transfer_status IS NULL THEN
        RAISE EXCEPTION 'Transfer not found or you do not have permission.';
    END IF;

    -- 2. Check permissions
    v_user_can_cancel := false;
    IF v_transfer_status = 'solicitado' THEN
        SELECT EXISTS (
            SELECT 1
            FROM auth.users u,
                 jsonb_array_elements(u.raw_app_meta_data->'assignments') as assignment
            WHERE u.id = p_user_id
              AND (assignment->>'branch_id' = v_origin_branch_id::text OR assignment->>'branch_id' = v_destination_branch_id::text)
              AND assignment->>'tenant_id' = p_tenant_id::text
        ) INTO v_user_can_cancel;
    ELSIF v_transfer_status = 'aprobado' THEN
        SELECT EXISTS (
            SELECT 1
            FROM auth.users u,
                 jsonb_array_elements(u.raw_app_meta_data->'assignments') as assignment
            WHERE u.id = p_user_id
              AND assignment->>'branch_id' = v_origin_branch_id::text
              AND assignment->>'tenant_id' = p_tenant_id::text
        ) INTO v_user_can_cancel;
    END IF;

    IF NOT v_user_can_cancel THEN
        RAISE EXCEPTION 'You do not have permission to cancel this transfer in its current state.';
    END IF;

    -- 3. Update the transfer status to 'cancelado'
    UPDATE public.product_transfers
    SET status = 'cancelado', updated_at = now()
    WHERE id = p_transfer_id
    RETURNING * INTO updated_transfer;

    RETURN to_jsonb(updated_transfer);
END;
$$;

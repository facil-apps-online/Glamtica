CREATE OR REPLACE FUNCTION public.create_product_transfer_request(
    p_requesting_branch_id uuid,
    p_origin_branch_id uuid,
    p_notes text,
    p_items jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tenant_id uuid;
    new_transfer record;
    item jsonb;
BEGIN
    -- Get tenant_id from the JWT claims
    v_tenant_id := (auth.jwt()->>'app_metadata')::jsonb->>'tenant_id';

    -- 1. Create the product_transfers record
    INSERT INTO public.product_transfers (
        tenant_id,
        requesting_branch_id,
        origin_branch_id,
        destination_branch_id,
        status,
        notes,
        transfer_date
    )
    VALUES (
        v_tenant_id,
        p_requesting_branch_id,
        p_origin_branch_id,
        p_requesting_branch_id, -- Destination is the same as the requesting branch
        'solicitado',
        p_notes,
        now()
    )
    RETURNING * INTO new_transfer;

    -- 2. Create product_transfer_items records
    FOR item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO public.product_transfer_items (
            transfer_id,
            product_id,
            quantity
        )
        VALUES (
            new_transfer.id,
            (item->>'product_id')::uuid,
            (item->>'quantity')::integer
        );
    END LOOP;

    -- 3. Return the newly created transfer
    RETURN to_jsonb(new_transfer);
END;
$$;

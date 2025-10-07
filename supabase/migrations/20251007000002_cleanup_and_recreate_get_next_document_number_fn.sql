-- Step 1: Drop all potentially conflicting versions of the function.
-- We drop by signature to be precise.
DROP FUNCTION IF EXISTS public.get_next_document_number(uuid, text, uuid);
DROP FUNCTION IF EXISTS public.get_next_document_number(uuid, text, uuid, jsonb);

-- Step 2: Recreate the function from the latest definition (V3 with date placeholders).
CREATE OR REPLACE FUNCTION public.get_next_document_number(
    p_tenant_id uuid,
    p_document_type text,
    p_branch_id uuid DEFAULT NULL,
    p_context_data jsonb DEFAULT '{}'::jsonb
)
RETURNS text AS $$
DECLARE
    sequence_rec RECORD;
    branch_rec RECORD;
    formatted_number text;
    next_number integer;
    current_ts timestamptz := now(); -- Get current timestamp once
BEGIN
    -- Find the appropriate sequence and lock the row for update
    SELECT *
    INTO sequence_rec
    FROM public.document_sequences
    WHERE tenant_id = p_tenant_id
      AND document_type = p_document_type
      AND (branch_id = p_branch_id OR branch_id IS NULL)
      AND is_active = true
    ORDER BY branch_id DESC NULLS LAST
    LIMIT 1
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No active document sequence found for document type %', p_document_type;
    END IF;

    -- Get the number for the current document
    next_number := sequence_rec.current_number;

    -- Increment the number for the next call
    UPDATE public.document_sequences
    SET current_number = current_number + 1
    WHERE id = sequence_rec.id;

    -- Start with the format template
    formatted_number := COALESCE(sequence_rec.format_template, '{prefix}{sequence}');

    -- Replace date placeholders
    formatted_number := replace(formatted_number, '{YYYY}', to_char(current_ts, 'YYYY'));
    formatted_number := replace(formatted_number, '{YY}', to_char(current_ts, 'YY'));
    formatted_number := replace(formatted_number, '{MM}', to_char(current_ts, 'MM'));
    formatted_number := replace(formatted_number, '{DD}', to_char(current_ts, 'DD'));

    -- Replace other placeholders
    formatted_number := replace(formatted_number, '{prefix}', COALESCE(sequence_rec.prefix, ''));
    formatted_number := replace(formatted_number, '{sequence}', LPAD(next_number::text, sequence_rec.padding, '0'));

    IF p_branch_id IS NOT NULL THEN
        SELECT code INTO branch_rec FROM public.branches WHERE id = p_branch_id;
        IF FOUND THEN
            formatted_number := replace(formatted_number, '{branch_code}', COALESCE(branch_rec.code, ''));
        END IF;
    END IF;

    IF p_context_data ? 'direction' THEN
        formatted_number := replace(formatted_number, '{direction}', p_context_data->>'direction');
    END IF;

    RETURN formatted_number;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.get_next_document_number(uuid, text, uuid, jsonb) IS 'V3: Safely retrieves the next formatted document number, supporting date placeholders like {YYYY}, {MM}, {DD}.';

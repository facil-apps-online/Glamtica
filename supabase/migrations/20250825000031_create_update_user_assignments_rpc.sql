-- Migration: Creates an RPC function to atomically update a user's assignments for a specific tenant.
-- FIX: Added a DROP FUNCTION statement to prevent errors when the function signature changes.

-- Step 1: Drop the function if it exists, to handle any signature changes.
DROP FUNCTION IF EXISTS public.update_user_assignments(uuid, uuid, jsonb);

-- Step 2: Create the function with the correct logic.
CREATE OR REPLACE FUNCTION update_user_assignments(
    p_user_id uuid,
    p_tenant_id uuid,
    p_new_assignments jsonb
)
RETURNS void AS $$
DECLARE
    assignment_data jsonb;
BEGIN
    -- Step 1: Delete all existing assignments for this user and tenant.
    -- This is simple and effective, ensuring no old assignments linger.
    DELETE FROM public.user_assignments
    WHERE user_id = p_user_id AND tenant_id = p_tenant_id;

    -- Step 2: Insert all the new assignments from the payload.
    IF jsonb_array_length(p_new_assignments) > 0 THEN
        FOR assignment_data IN SELECT * FROM jsonb_array_elements(p_new_assignments)
        LOOP
            -- We need to handle the case where branch_id might be null
            INSERT INTO public.user_assignments (user_id, tenant_id, role_id, branch_id, status)
            VALUES (
                p_user_id,
                p_tenant_id,
                (assignment_data->>'role_id')::uuid,
                CASE
                    WHEN assignment_data->>'branch_id' IS NULL OR assignment_data->>'branch_id' = 'null' THEN NULL
                    ELSE (assignment_data->>'branch_id')::uuid
                END,
                (assignment_data->>'status')::text
            );
        END LOOP;
    END IF;
END;
$$ LANGUAGE plpgsql;
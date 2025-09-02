-- Migration: Repopulate user_assignments table with correct data

-- Step 1: Delete all existing data from user_assignments to ensure a clean slate
DELETE FROM public.user_assignments;

-- Step 2: Migrate data from auth.users.raw_app_meta_data
INSERT INTO public.user_assignments (tenant_id, branch_id, user_id, role_id, status, created_at, updated_at)
SELECT
    (assignment ->> 'tenant_id')::uuid,
    (assignment ->> 'branch_id')::uuid,
    u.id,
    (assignment ->> 'role_id')::uuid,
    (assignment ->> 'status'),
    u.created_at,
    u.updated_at
FROM
    auth.users u,
    jsonb_array_elements(u.raw_app_meta_data -> 'assignments') AS assignment
WHERE
    (assignment ->> 'tenant_id')::uuid IN ('a23cefcb-2872-4566-971b-ffe40a5277aa', 'b79526f0-ad65-4ba6-b09e-a7e46eb7b936', '2a90a6f6-c6ce-4a2a-bf84-75a558b1fc19')
AND
    (assignment ->> 'role_id') IS NOT NULL;

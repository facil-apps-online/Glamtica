-- Migration: Fix user_assignments data by repopulating the table

-- Step 1: Delete all existing data from user_assignments to ensure a clean slate
DELETE FROM public.user_assignments;

-- Step 2: Migrate data from get_tenant_users for the three test tenants
INSERT INTO public.user_assignments (tenant_id, branch_id, user_id, role_id, status, created_at, updated_at)
SELECT
    t.tenant_id,
    gtu.branch_id,
    gtu.user_id,
    r.id,
    gtu.status,
    u.created_at,
    u.updated_at
FROM
    (VALUES
        ('a23cefcb-2872-4566-971b-ffe40a5277aa'::uuid),
        ('b79526f0-ad65-4ba6-b09e-a7e46eb7b936'::uuid),
        ('2a90a6f6-c6ce-4a2a-bf84-75a558b1fc19'::uuid)
    ) AS t(tenant_id)
CROSS JOIN LATERAL
    public.get_tenant_users(t.tenant_id) gtu
JOIN
    public.roles r ON gtu.role_name = r.name
JOIN
    auth.users u ON gtu.user_id = u.id
ON CONFLICT (tenant_id, user_id, branch_id) DO NOTHING;

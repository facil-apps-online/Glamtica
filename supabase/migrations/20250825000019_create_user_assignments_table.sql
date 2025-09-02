-- Migration: Create user_assignments table and migrate data

-- Step 1: Create the new user_assignments table
CREATE TABLE public.user_assignments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE, -- Allowed to be NULL
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'active',
    default_product_commission_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    default_service_commission_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT user_assignments_unique_assignment UNIQUE (tenant_id, user_id, branch_id)
);

-- Add comments to the new columns
COMMENT ON COLUMN public.user_assignments.status IS 'The status of the user assignment (e.g., active, inactive)';
COMMENT ON COLUMN public.user_assignments.default_product_commission_rate IS 'Default commission rate for product sales for this user in this branch.';
COMMENT ON COLUMN public.user_assignments.default_service_commission_rate IS 'Default commission rate for services for this user in this branch.';

-- Step 2: Migrate data from auth.users.raw_app_meta_data to user_assignments
INSERT INTO public.user_assignments (tenant_id, branch_id, user_id, role_id, status, created_at, updated_at)
SELECT
    (assignment ->> 'tenant_id')::uuid,
    (assignment ->> 'branch_id')::uuid, -- This will be NULL for super_admins
    u.id,
    r.id, -- Directly use the role id from the join
    (assignment ->> 'status'),
    u.created_at,
    u.updated_at
FROM
    auth.users u,
    jsonb_array_elements(u.raw_app_meta_data -> 'assignments') AS assignment
-- Join with the roles table to ensure the role exists
JOIN
    public.roles r ON r.name = (assignment ->> 'role')
WHERE
    (assignment ->> 'branch_id') IS NOT NULL OR (assignment ->> 'role') IN ('tenant_super_admin', 'super_admin')
ON CONFLICT (tenant_id, user_id, branch_id) DO NOTHING;

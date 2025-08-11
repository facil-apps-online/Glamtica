-- Step 1: Drop the old policy that depends on the branch_id column
DROP POLICY IF EXISTS tenant_branch_policy_clients ON public.clients;

-- Step 2: Drop the foreign key and the column from clients table
ALTER TABLE public.clients DROP CONSTRAINT IF EXISTS fk_clients_branch;
ALTER TABLE public.clients DROP COLUMN IF EXISTS branch_id;

-- Step 3: Add new columns to the clients table
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS document_type TEXT,
ADD COLUMN IF NOT EXISTS document_number TEXT,
ADD COLUMN IF NOT EXISTS parent_client_id UUID;

-- Add foreign key constraint separately to avoid issues if column already exists
ALTER TABLE public.clients DROP CONSTRAINT IF EXISTS fk_clients_parent_client;
ALTER TABLE public.clients
ADD CONSTRAINT fk_clients_parent_client FOREIGN KEY (parent_client_id) REFERENCES clients(id) ON DELETE SET NULL;

-- Step 4: Create the new join table for the many-to-many relationship
CREATE TABLE IF NOT EXISTS public.client_branches (
    client_id UUID NOT NULL,
    branch_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_client_branches PRIMARY KEY (client_id, branch_id),
    CONSTRAINT fk_client_branches_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    CONSTRAINT fk_client_branches_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    CONSTRAINT fk_client_branches_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Step 5: Add a trigger for auditing changes to the new table
CREATE OR REPLACE TRIGGER audit_client_branches_changes
AFTER INSERT OR DELETE OR UPDATE ON public.client_branches
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Step 6: Create helper functions for RLS policies
CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT NULLIF(current_setting('request.jwt.claims', true)::jsonb->'app_metadata'->'assignments'->0->>'tenant_id', '')::uuid;
$$;

CREATE OR REPLACE FUNCTION get_user_accessible_branches()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT (jsonb_array_elements(NULLIF(current_setting('request.jwt.claims', true)::jsonb->'app_metadata'->'assignments', '[]'::jsonb))->>'branch_id')::uuid;
$$;

-- Step 7: Create new RLS policies for the new structure
-- Enable RLS on the tables if not already enabled
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_branches ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist, to be safe
DROP POLICY IF EXISTS clients_access_policy ON public.clients;
DROP POLICY IF EXISTS client_branches_access_policy ON public.client_branches;

-- Policy for clients table
CREATE POLICY clients_access_policy ON public.clients
AS PERMISSIVE FOR ALL
TO authenticated
USING (
    (get_user_tenant_id() = tenant_id) AND
    (
        EXISTS (
            SELECT 1
            FROM client_branches cb
            WHERE cb.client_id = clients.id
            AND cb.branch_id IN (SELECT get_user_accessible_branches())
        )
    )
)
WITH CHECK (
    (get_user_tenant_id() = tenant_id)
);

-- Policy for client_branches table
CREATE POLICY client_branches_access_policy ON public.client_branches
AS PERMISSIVE FOR ALL
TO authenticated
USING (
    (get_user_tenant_id() = tenant_id) AND
    (branch_id IN (SELECT get_user_accessible_branches()))
)
WITH CHECK (
    (get_user_tenant_id() = tenant_id)
);

-- Step 8: Update comments
COMMENT ON TABLE public.clients IS 'Stores client information. Clients can be associated with multiple branches via the client_branches table.';
COMMENT ON POLICY clients_access_policy ON public.clients IS 'Users can access clients of their tenant if they have access to at least one of the client''s branches.';
COMMENT ON POLICY client_branches_access_policy ON public.client_branches IS 'Users can access client-branch associations of their tenant if they have access to the branch.';
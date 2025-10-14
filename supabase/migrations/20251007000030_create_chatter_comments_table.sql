-- Migration for chatter_comments table

CREATE TABLE public.chatter_comments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    resource_type text NOT NULL,
    resource_id uuid NOT NULL,
    comment_text text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT comment_not_empty CHECK (comment_text <> '')
);

COMMENT ON TABLE public.chatter_comments IS 'Stores manual comments made by users on a specific resource, as part of the chatter system.';

CREATE INDEX idx_chatter_comments_resource ON public.chatter_comments(tenant_id, resource_type, resource_id);

ALTER TABLE public.chatter_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to read comments in their tenant" 
ON public.chatter_comments FOR SELECT
USING (
    (auth.jwt() -> 'app_metadata' -> 'assignments' -> 0 ->> 'tenant_id')::uuid = tenant_id
);

CREATE POLICY "Allow users to create comments in their tenant"
ON public.chatter_comments FOR INSERT
WITH CHECK (
    (auth.jwt() -> 'app_metadata' -> 'assignments' -> 0 ->> 'tenant_id')::uuid = tenant_id
);

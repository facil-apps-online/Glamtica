
-- This migration adds Google Drive-based file attachment capabilities to the chatter feature.

-- Step 1: Create the chatter_attachments table
CREATE TABLE IF NOT EXISTS public.chatter_attachments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamptz NOT NULL DEFAULT now(),
    chatter_comment_id uuid NOT NULL REFERENCES public.chatter_comments(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id),
    tenant_id uuid NOT NULL,
    file_name text NOT NULL,
    mime_type text NOT NULL,
    file_size bigint NOT NULL,
    google_drive_file_id text NOT NULL
);

-- Add indexes for performance
CREATE INDEX idx_chatter_attachments_chatter_comment_id ON public.chatter_attachments(chatter_comment_id);
CREATE INDEX idx_chatter_attachments_tenant_id ON public.chatter_attachments(tenant_id);

-- Enable RLS
ALTER TABLE public.chatter_attachments ENABLE ROW LEVEL SECURITY;

-- Grant access to the table
GRANT SELECT, INSERT, DELETE ON public.chatter_attachments TO authenticated;
GRANT ALL ON public.chatter_attachments TO service_role;

-- RLS Policies for chatter_attachments
CREATE POLICY "Users can view attachments in their own tenant" 
ON public.chatter_attachments FOR SELECT 
USING (tenant_id IN (SELECT tenant_id FROM public.user_assignments WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert attachments for their own comments" 
ON public.chatter_attachments FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own attachments" 
ON public.chatter_attachments FOR DELETE 
USING (user_id = auth.uid());

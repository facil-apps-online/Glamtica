CREATE TABLE public.branch_playback_state (
    branch_id uuid PRIMARY KEY REFERENCES public.branches(id) ON DELETE CASCADE,
    current_playlist_item_id uuid REFERENCES public.playlist_items(id) ON DELETE SET NULL,
    video_started_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.branch_playback_state ENABLE ROW LEVEL SECURITY;

-- Policies for RLS
CREATE POLICY "Allow read access for authenticated users in the same tenant" ON public.branch_playback_state
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.branches
        WHERE branches.id = branch_playback_state.branch_id AND branches.tenant_id = auth.uid()
    )
);

CREATE POLICY "Allow insert access for authenticated users in the same tenant" ON public.branch_playback_state
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.branches
        WHERE branches.id = branch_playback_state.branch_id AND branches.tenant_id = auth.uid()
    )
);

CREATE POLICY "Allow update access for authenticated users in the same tenant" ON public.branch_playback_state
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.branches
        WHERE branches.id = branch_playback_state.branch_id AND branches.tenant_id = auth.uid()
    )
);

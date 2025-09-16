-- Disable Row Level Security on the branch_playback_state table.
-- This table needs to be publicly readable for the TV display's Realtime subscription to work,
-- as the TV client is anonymous.
-- This change makes its behavior consistent with the 'turns' table, which is also publicly readable.
-- Write operations are protected by the 'tenant-actions' edge function.
ALTER TABLE public.branch_playback_state DISABLE ROW LEVEL SECURITY;

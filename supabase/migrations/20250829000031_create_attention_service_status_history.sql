CREATE TABLE public.attention_service_status_history (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    attention_service_id uuid NOT NULL,
    status text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    tenant_id uuid NOT NULL,
    branch_id uuid NOT NULL,
    user_id uuid NULL,
    notes text NULL,
    CONSTRAINT attention_service_status_history_pkey PRIMARY KEY (id),
    CONSTRAINT attention_service_status_history_attention_service_id_fkey FOREIGN KEY (attention_service_id) REFERENCES public.attention_services(id) ON DELETE CASCADE,
    CONSTRAINT attention_service_status_history_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE,
    CONSTRAINT attention_service_status_history_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE,
    CONSTRAINT attention_service_status_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL
);

COMMENT ON TABLE public.attention_service_status_history IS 'Stores the history of status changes for each attention service.';
COMMENT ON COLUMN public.attention_service_status_history.status IS 'The new status assigned to the service (e.g., En Progreso, Finalizado).';
COMMENT ON COLUMN public.attention_service_status_history.created_at IS 'The exact timestamp when the status change occurred.';

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_assh_attention_service_id ON public.attention_service_status_history USING btree (attention_service_id);
CREATE INDEX IF NOT EXISTS idx_assh_created_at ON public.attention_service_status_history USING btree (created_at);

-- RLS Policies
ALTER TABLE public.attention_service_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to assigned users and branch/tenant members"
ON public.attention_service_status_history
FOR SELECT
USING (
  (EXISTS ( SELECT 1
           FROM user_assignments ua
          WHERE ua.user_id = auth.uid() AND (ua.tenant_id = attention_service_status_history.tenant_id OR ua.branch_id = attention_service_status_history.branch_id)))
);

-- Since this table is for auditing and should not be directly inserted/updated/deleted by users,
-- we will not create policies for INSERT, UPDATE, DELETE. These actions will be handled by
-- security definer functions on the backend.

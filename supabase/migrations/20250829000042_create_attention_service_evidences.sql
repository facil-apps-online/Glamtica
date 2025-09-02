-- Migration to create the attention_service_evidences table for Google Drive integration.

-- Drop existing table if it exists to ensure a clean slate (optional, for development)
-- DROP TABLE IF EXISTS public.service_evidence CASCADE;

-- Create the new table with the correct name and foreign key.
CREATE TABLE public.attention_service_evidences (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    attention_service_id uuid NOT NULL,
    google_drive_file_id text NOT NULL,
    file_name text NOT NULL,
    mime_type text NULL,
    tenant_id uuid NOT NULL,
    branch_id uuid NOT NULL,
    user_id uuid NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT attention_service_evidences_pkey PRIMARY KEY (id),
    CONSTRAINT fk_attention_service_evidences_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_attention_service_evidences_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    CONSTRAINT fk_attention_service_evidences_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL,
    CONSTRAINT fk_attention_service_evidences_attention_service FOREIGN KEY (attention_service_id) REFERENCES public.attention_services(id) ON DELETE CASCADE
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_ase_attention_service_id ON public.attention_service_evidences USING btree (attention_service_id);
CREATE INDEX IF NOT EXISTS idx_ase_tenant_id ON public.attention_service_evidences USING btree (tenant_id);

-- Add triggers for auditing and timestamp updates
CREATE TRIGGER audit_attention_service_evidences_changes
AFTER INSERT OR UPDATE OR DELETE ON public.attention_service_evidences
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER update_attention_service_evidences_updated_at
BEFORE UPDATE ON public.attention_service_evidences
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

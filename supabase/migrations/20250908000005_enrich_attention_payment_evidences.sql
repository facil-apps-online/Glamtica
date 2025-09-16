-- 1. Add missing columns to attention_payment_evidences
ALTER TABLE public.attention_payment_evidences
ADD COLUMN mime_type TEXT NULL,
ADD COLUMN user_id UUID NULL,
ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
ADD COLUMN file_size BIGINT NULL;

-- 2. Add foreign key constraints
-- Assuming the primary key of attention_payments is 'id'
ALTER TABLE public.attention_payment_evidences
ADD CONSTRAINT fk_ape_attention_payment FOREIGN KEY (attention_payment_id) REFERENCES public.attention_payments(id) ON DELETE CASCADE,
ADD CONSTRAINT fk_ape_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE,
ADD CONSTRAINT fk_ape_branch FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE,
ADD CONSTRAINT fk_ape_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- 3. Create indexes for the new foreign keys
CREATE INDEX IF NOT EXISTS idx_ape_attention_payment_id ON public.attention_payment_evidences USING btree (attention_payment_id);
CREATE INDEX IF NOT EXISTS idx_ape_tenant_id ON public.attention_payment_evidences USING btree (tenant_id);
CREATE INDEX IF NOT EXISTS idx_ape_branch_id ON public.attention_payment_evidences USING btree (branch_id);
CREATE INDEX IF NOT EXISTS idx_ape_user_id ON public.attention_payment_evidences USING btree (user_id);

-- 4. Add triggers
-- Assuming audit_trigger_function and update_updated_at_column exist and are generic
CREATE TRIGGER audit_attention_payment_evidences_changes
AFTER INSERT OR DELETE OR UPDATE ON public.attention_payment_evidences
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER update_attention_payment_evidences_updated_at
BEFORE UPDATE ON public.attention_payment_evidences
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. Add comments to new columns for clarity
COMMENT ON COLUMN public.attention_payment_evidences.mime_type IS 'MIME type of the uploaded file.';
COMMENT ON COLUMN public.attention_payment_evidences.user_id IS 'The user who uploaded the evidence.';
COMMENT ON COLUMN public.attention_payment_evidences.updated_at IS 'Timestamp of the last update.';
COMMENT ON COLUMN public.attention_payment_evidences.file_size IS 'Size of the uploaded file in bytes.';

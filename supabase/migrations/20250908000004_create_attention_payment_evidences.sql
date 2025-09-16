CREATE TABLE attention_payment_evidences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attention_payment_id UUID NOT NULL,
    file_name TEXT NOT NULL,
    google_drive_file_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    tenant_id UUID NOT NULL,
    branch_id UUID NOT NULL
);
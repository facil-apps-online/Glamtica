
CREATE TABLE rescheduled_attentions (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    attention_id UUID NOT NULL REFERENCES attentions(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    original_date TIMESTAMPTZ NOT NULL,
    new_date TIMESTAMPTZ NOT NULL,
    reason TEXT,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE rescheduled_attentions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated users" ON rescheduled_attentions
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

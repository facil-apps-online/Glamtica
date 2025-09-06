
ALTER TABLE rescheduled_attentions
ADD COLUMN fault TEXT CHECK (fault IN ('cliente', 'establecimiento'));

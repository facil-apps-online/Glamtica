-- Add file_size column to the correct evidence table
ALTER TABLE public.attention_service_evidences
ADD COLUMN file_size BIGINT NULL;

-- Drop the old, unused service_evidence table
DROP TABLE IF EXISTS public.service_evidence;

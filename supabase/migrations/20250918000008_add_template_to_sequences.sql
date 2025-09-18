ALTER TABLE public.document_sequences
ADD COLUMN format_template TEXT;

COMMENT ON COLUMN public.document_sequences.format_template IS 'A template for formatting the document number, e.g., ''{prefix}/{branch_code}/{sequence}''.';

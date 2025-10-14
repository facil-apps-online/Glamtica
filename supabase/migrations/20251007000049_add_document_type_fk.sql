
-- supabase/migrations/20251007000049_add_document_type_fk.sql

-- Add document_type_id to clients table
ALTER TABLE public.clients
ADD COLUMN document_type_id UUID,
ADD CONSTRAINT fk_clients_document_type
FOREIGN KEY (document_type_id) REFERENCES document_types(id)
ON DELETE SET NULL;

-- Add document_type_id to suppliers table
ALTER TABLE public.suppliers
ADD COLUMN document_type_id UUID,
ADD CONSTRAINT fk_suppliers_document_type
FOREIGN KEY (document_type_id) REFERENCES document_types(id)
ON DELETE SET NULL;

-- Comment on the new columns
COMMENT ON COLUMN public.clients.document_type_id IS 'Foreign key to the custom document type.';
COMMENT ON COLUMN public.suppliers.document_type_id IS 'Foreign key to the custom document type.';

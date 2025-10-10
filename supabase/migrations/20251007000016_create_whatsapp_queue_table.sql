-- Create a status type for the new WhatsApp queue
CREATE TYPE public.client_whatsapp_queue_status AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'FAILED');

-- Create the table for the WhatsApp message queue
CREATE TABLE public.client_whatsapp_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    recipient_client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    recipient_phone_number TEXT NOT NULL,
    template_name TEXT NOT NULL,
    template_params JSONB,
    status public.client_whatsapp_queue_status NOT NULL DEFAULT 'PENDING',
    attempts INT NOT NULL DEFAULT 0,
    last_attempt_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.client_whatsapp_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow backend services (using service_role) to manage the queue.
CREATE POLICY "Allow service_role to manage client whatsapp queue"
ON public.client_whatsapp_queue
FOR ALL
USING (true)
WITH CHECK (true);

-- Create a trigger to automatically update the 'updated_at' column
CREATE TRIGGER handle_updated_at_client_whatsapp_queue
BEFORE UPDATE ON public.client_whatsapp_queue
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Add comments for clarity
COMMENT ON TABLE public.client_whatsapp_queue IS 'Work queue for sending transactional WhatsApp messages to end clients.';
COMMENT ON COLUMN public.client_whatsapp_queue.tenant_id IS 'Identifies the tenant to use their specific integration settings (e.g., WhatsApp credentials).';
COMMENT ON COLUMN public.client_whatsapp_queue.recipient_phone_number IS 'The recipient''s phone number in international format.';
COMMENT ON COLUMN public.client_whatsapp_queue.template_name IS 'The name of the pre-approved WhatsApp message template.';
COMMENT ON COLUMN public.client_whatsapp_queue.template_params IS 'JSON object containing the variables for the message template.';

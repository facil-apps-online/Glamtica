-- Crear un tipo de estado específico para la nueva cola de clientes
CREATE TYPE client_email_queue_status AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'FAILED');

-- Crear la tabla que actuará como una cola de trabajos para el envío de correos a clientes
CREATE TABLE public.client_email_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    recipient_client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    recipient_email TEXT NOT NULL,
    template_type TEXT NOT NULL,
    template_data JSONB,
    status client_email_queue_status NOT NULL DEFAULT 'PENDING', 
    attempts INT NOT NULL DEFAULT 0,
    last_attempt_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.client_email_queue ENABLE ROW LEVEL SECURITY;

-- Política de acceso: Permitir a los servicios del backend (usando service_role) operar en la tabla.
-- Los usuarios no deben tener acceso directo.
CREATE POLICY "Allow service_role to manage client email queue"
ON public.client_email_queue
FOR ALL
USING (true)
WITH CHECK (true);


-- Crear un trigger para actualizar 'updated_at'
CREATE TRIGGER handle_updated_at_client_email_queue
BEFORE UPDATE ON public.client_email_queue
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

COMMENT ON TABLE public.client_email_queue IS 'Cola de trabajos para el envío de correos transaccionales a clientes finales.';
COMMENT ON COLUMN public.client_email_queue.tenant_id IS 'Identifica al tenant para el cual se envía el correo, para usar su configuración de envío.';
COMMENT ON COLUMN public.client_email_queue.recipient_client_id IS 'El cliente al que se le envía el correo, si está registrado.';
COMMENT ON COLUMN public.client_email_queue.recipient_email IS 'La dirección de correo electrónico del destinatario.';

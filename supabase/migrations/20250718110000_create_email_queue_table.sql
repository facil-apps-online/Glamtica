-- Crear la tabla que actuará como una cola de trabajos para el envío de correos.

CREATE TYPE email_queue_status AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'FAILED');

CREATE TABLE public.email_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    template_type TEXT NOT NULL,
    template_data JSONB NOT NULL,
    status email_queue_status NOT NULL DEFAULT 'PENDING',
    attempts INT NOT NULL DEFAULT 0,
    last_attempt_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;

-- Crear un trigger para actualizar 'updated_at'
CREATE TRIGGER handle_updated_at_email_queue
BEFORE UPDATE ON public.email_queue
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

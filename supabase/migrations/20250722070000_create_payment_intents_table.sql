-- Migración para crear la tabla payment_intents.
-- Esta tabla actúa como un puente entre una acción del usuario (ej. renovar suscripción) y el pago final.

CREATE TABLE public.payment_intents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, COMPLETED, FAILED
    amount_in_cents BIGINT NOT NULL,
    currency VARCHAR(3) NOT NULL,
    reference TEXT NOT NULL UNIQUE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger para actualizar automáticamente el campo updated_at
CREATE TRIGGER handle_payment_intents_updated_at
BEFORE UPDATE ON public.payment_intents
FOR EACH ROW
EXECUTE PROCEDURE moddatetime (updated_at);

-- Comentarios para la tabla y columnas clave
COMMENT ON TABLE public.payment_intents IS 'Registra la intención de un pago antes de enviarlo a la pasarela, vinculando la transacción a una acción específica.';
COMMENT ON COLUMN public.payment_intents.reference IS 'Referencia única generada por nuestro sistema que se envía a la pasarela de pago.';
COMMENT ON COLUMN public.payment_intents.metadata IS 'Datos JSON para almacenar el propósito del pago, ej: { "type": "SUBSCRIPTION_RENEWAL", "plan_price_id": "..." }.';

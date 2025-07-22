-- Migración para crear la tabla de pagos (payments).
-- Esta tabla almacenará un registro de cada transacción procesada a través de pasarelas de pago.

CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE SET NULL,
    provider TEXT NOT NULL,
    provider_payment_id TEXT NOT NULL,
    amount_in_cents BIGINT NOT NULL,
    currency VARCHAR(3) NOT NULL,
    status TEXT NOT NULL,
    reference TEXT NOT NULL,
    environment TEXT NOT NULL,
    full_response JSONB,
    payment_date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Unicidad para evitar registrar el mismo pago dos veces
    CONSTRAINT unique_provider_payment UNIQUE (provider, provider_payment_id)
);

-- Trigger para actualizar automáticamente el campo updated_at
CREATE TRIGGER handle_payments_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW
EXECUTE PROCEDURE moddatetime (updated_at);

-- Comentarios en las columnas para mayor claridad
COMMENT ON TABLE public.payments IS 'Almacena registros de transacciones de pasarelas de pago.';
COMMENT ON COLUMN public.payments.provider_payment_id IS 'El ID único de la transacción asignado por el proveedor de pagos (ej. Wompi).';
COMMENT ON COLUMN public.payments.reference IS 'Nuestra referencia interna única enviada al proveedor de pagos.';
COMMENT ON COLUMN public.payments.full_response IS 'El objeto JSON completo recibido del webhook del proveedor para auditoría y depuración.';

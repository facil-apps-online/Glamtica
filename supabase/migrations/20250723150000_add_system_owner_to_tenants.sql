-- Añade la columna is_system_owner a la tabla tenants
ALTER TABLE public.tenants
ADD COLUMN is_system_owner BOOLEAN NOT NULL DEFAULT false;

-- Crea un índice único para asegurar que solo un tenant pueda ser el propietario del sistema.
-- La condición `WHERE is_system_owner IS TRUE` asegura que la unicidad solo se aplique
-- a los tenants marcados como propietarios, permitiendo múltiples `false` valores.
CREATE UNIQUE INDEX unique_system_owner
ON public.tenants (is_system_owner)
WHERE (is_system_owner = true);

-- Comentario sobre la nueva columna para futura referencia.
COMMENT ON COLUMN public.tenants.is_system_owner IS 'Identifica al tenant que actúa como propietario del sistema, usado para configuraciones globales como pasarelas de pago para suscripciones.';

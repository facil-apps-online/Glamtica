-- Migración para crear la tabla subscription_items
-- Esta tabla almacenará los add-ons de una suscripción, como sucursales extra.

CREATE TABLE IF NOT EXISTS public.subscription_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES public.tenant_subscriptions(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL, -- Ej: 'extra_branch', 'advanced_reports'
    item_id UUID, -- Opcional: El ID del recurso específico, como el ID de la sucursal
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price_at_addition NUMERIC(10, 2) NOT NULL, -- El precio unitario en el momento de la adición
    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT check_item_type CHECK (item_type IN ('extra_branch', 'extra_user', 'advanced_reports')) -- Se puede expandir en el futuro
);

-- Índices para mejorar el rendimiento de las consultas
CREATE INDEX IF NOT EXISTS idx_subscription_items_subscription_id ON public.subscription_items(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_items_item_type ON public.subscription_items(item_type);

-- Trigger para la columna updated_at
CREATE OR REPLACE TRIGGER trigger_subscription_items_updated_at
BEFORE UPDATE ON public.subscription_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar Row Level Security
ALTER TABLE public.subscription_items ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
CREATE POLICY "Enable read access for admins" ON public.subscription_items
FOR SELECT USING (
  (
    SELECT r.name
    FROM public.users u
    JOIN public.roles r ON u.role_id = r.id
    WHERE u.id = auth.uid()
  ) IN ('super_admin', 'tenant_super_admin', 'tenant_admin')
);

COMMENT ON TABLE public.subscription_items IS 'Almacena items o add-ons específicos asociados a una suscripción de tenant.';
COMMENT ON COLUMN public.subscription_items.item_type IS 'Define el tipo de add-on, ej: ''extra_branch''.';
COMMENT ON COLUMN public.subscription_items.unit_price_at_addition IS 'Registra el costo del item en el momento en que fue añadido a la suscripción.';

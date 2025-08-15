-- Tabla Maestra de Combos
CREATE TABLE combos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    sku TEXT,
    barcode TEXT,
    image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE combos IS 'Tabla maestra para almacenar los combos o kits de productos/servicios.';

-- Items que componen un combo (con su precio base)
CREATE TABLE combo_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    combo_id UUID NOT NULL REFERENCES combos(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT check_item_not_null CHECK (product_id IS NOT NULL OR service_id IS NOT NULL)
);
COMMENT ON TABLE combo_items IS 'Detalle de los productos o servicios que componen un combo, con su cantidad y precio base.';

-- Asignación de un combo a una sucursal
CREATE TABLE branch_combos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    combo_id UUID NOT NULL REFERENCES combos(id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(branch_id, combo_id)
);
COMMENT ON TABLE branch_combos IS 'Tabla que asigna un combo a una sucursal, permitiendo activarlo o desactivarlo para la venta en esa ubicación.';

-- Precios específicos (overrides) de items de un combo por sucursal
CREATE TABLE branch_combo_item_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    combo_id UUID NOT NULL REFERENCES combos(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT check_item_override_not_null CHECK (product_id IS NOT NULL OR service_id IS NOT NULL)
);
COMMENT ON TABLE branch_combo_item_prices IS 'Almacena los precios específicos (overrides) para un ítem de un combo en una sucursal particular.';

-- Índices Únicos Parciales
CREATE UNIQUE INDEX combos_tenant_id_sku_unique_idx ON combos (tenant_id, sku) WHERE sku IS NOT NULL;
CREATE UNIQUE INDEX branch_combo_item_prices_product_unique_idx ON branch_combo_item_prices (branch_id, combo_id, product_id) WHERE service_id IS NULL;
CREATE UNIQUE INDEX branch_combo_item_prices_service_unique_idx ON branch_combo_item_prices (branch_id, combo_id, service_id) WHERE product_id IS NULL;


-- Políticas de Seguridad (RLS) CORRECTAS

-- combos
ALTER TABLE combos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow full access to own combos" ON combos
    FOR ALL USING (public.tenant_only_rls_policy(tenant_id)) WITH CHECK (public.tenant_only_rls_policy(tenant_id));

-- combo_items
ALTER TABLE combo_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow access to items of own combos" ON combo_items
    FOR ALL USING (EXISTS (SELECT 1 FROM combos WHERE combos.id = combo_items.combo_id AND public.tenant_only_rls_policy(combos.tenant_id))) WITH CHECK (EXISTS (SELECT 1 FROM combos WHERE combos.id = combo_items.combo_id AND public.tenant_only_rls_policy(combos.tenant_id)));

-- branch_combos
ALTER TABLE branch_combos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow access to own branch combo assignments" ON branch_combos
    FOR ALL USING (public.tenant_only_rls_policy(tenant_id)) WITH CHECK (public.tenant_only_rls_policy(tenant_id));

-- branch_combo_item_prices
ALTER TABLE branch_combo_item_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow access to own branch combo item prices" ON branch_combo_item_prices
    FOR ALL USING (public.tenant_only_rls_policy(tenant_id)) WITH CHECK (public.tenant_only_rls_policy(tenant_id));

-- 1. Drop la función existente que usa el tipo problemático.
-- Usamos `IF EXISTS` para evitar errores si la función no existe por alguna razón.
DROP FUNCTION IF EXISTS create_product_transfer(
    p_tenant_id UUID,
    p_from_branch_id UUID,
    p_to_branch_id UUID,
    p_transfer_date TIMESTAMPTZ,
    p_notes TEXT,
    p_items product_transfer_item_type[]
);

-- 2. Opcional: Eliminar el tipo si ya no se usa en ningún otro lugar.
-- Por seguridad, no lo borramos, solo la función que lo usa.
-- DROP TYPE IF EXISTS product_transfer_item_type;

-- 3. Crear la nueva versión de la función aceptando JSONB.
CREATE OR REPLACE FUNCTION create_product_transfer(
    p_tenant_id UUID,
    p_from_branch_id UUID,
    p_to_branch_id UUID,
    p_transfer_date TIMESTAMPTZ,
    p_notes TEXT,
    p_items JSONB -- <-- Cambiado a JSONB
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    v_transfer_id UUID;
    item RECORD; -- Usamos un RECORD genérico para iterar
BEGIN
    -- 1. Crear el registro principal de la transferencia
    INSERT INTO product_transfers (tenant_id, from_branch_id, to_branch_id, transfer_date, status, notes)
    VALUES (p_tenant_id, p_from_branch_id, p_to_branch_id, p_transfer_date, 'en_proceso', p_notes)
    RETURNING id INTO v_transfer_id;

    -- 2. Insertar los items y actualizar el stock de origen usando jsonb_to_recordset
    FOR item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(product_id UUID, quantity INT)
    LOOP
        -- Insertar el item en la tabla de detalles
        INSERT INTO product_transfer_items (transfer_id, product_id, quantity)
        VALUES (v_transfer_id, item.product_id, item.quantity);

        -- Actualizar (restar) el stock en la sucursal de origen
        UPDATE branch_products
        SET stock_quantity = stock_quantity - item.quantity
        WHERE branch_id = p_from_branch_id AND product_id = item.product_id;
    END LOOP;

    -- 4. Devolver el ID de la transferencia creada
    RETURN v_transfer_id;
END;
$$;

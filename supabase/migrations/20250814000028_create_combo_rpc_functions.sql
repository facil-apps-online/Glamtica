-- Function to get combo details for a specific branch, calculating final prices
CREATE OR REPLACE FUNCTION get_combo_branch_details(p_tenant_id UUID, p_branch_id UUID, p_combo_id UUID)
RETURNS JSONB AS $$
DECLARE
    combo_details JSONB;
BEGIN
    -- NOTE: Security is handled by RLS policies and the calling edge function which verifies tenant access.

    SELECT jsonb_build_object(
        'id', c.id,
        'name', c.name,
        'description', c.description,
        'sku', c.sku,
        'is_active_in_branch', bc.is_active,
        'items', (
            SELECT COALESCE(jsonb_agg(
                jsonb_build_object(
                    'item_id', ci.id,
                    'product_id', ci.product_id,
                    'service_id', ci.service_id,
                    'name', COALESCE(p.name, s.name),
                    'quantity', ci.quantity,
                    'base_price', ci.price,
                    'override_price', bcip.price, -- The specific price for this branch, if it exists
                    'final_price', COALESCE(bcip.price, ci.price) -- Use override, fallback to base
                )
            ), '[]'::jsonb)
            FROM combo_items ci
            LEFT JOIN products p ON p.id = ci.product_id
            LEFT JOIN services s ON s.id = ci.service_id
            LEFT JOIN branch_combo_item_prices bcip ON bcip.combo_id = ci.combo_id
                AND bcip.branch_id = p_branch_id
                AND (bcip.product_id = ci.product_id OR bcip.service_id = ci.service_id)
            WHERE ci.combo_id = c.id
        )
    )
    INTO combo_details
    FROM combos c
    LEFT JOIN branch_combos bc ON bc.combo_id = c.id AND bc.branch_id = p_branch_id
    WHERE c.id = p_combo_id AND c.tenant_id = p_tenant_id;

    RETURN combo_details;
END;
$$ LANGUAGE plpgsql;

-- Function to upsert branch-specific price overrides for combo items
CREATE OR REPLACE FUNCTION update_combo_branch_prices(p_tenant_id UUID, p_branch_id UUID, p_combo_id UUID, p_price_overrides JSONB)
RETURNS VOID AS $$
DECLARE
    override RECORD;
    target_id UUID;
BEGIN
    -- NOTE: Security is handled by RLS policies and the calling edge function.

    FOR override IN 
        SELECT
            (value->>'product_id')::UUID as product_id,
            (value->>'service_id')::UUID as service_id,
            (value->>'price')::NUMERIC as price
        FROM jsonb_array_elements(p_price_overrides)
    LOOP
        target_id := NULL;

        IF override.product_id IS NOT NULL THEN
            SELECT id INTO target_id FROM branch_combo_item_prices
            WHERE branch_id = p_branch_id AND combo_id = p_combo_id AND product_id = override.product_id;
        ELSIF override.service_id IS NOT NULL THEN
            SELECT id INTO target_id FROM branch_combo_item_prices
            WHERE branch_id = p_branch_id AND combo_id = p_combo_id AND service_id = override.service_id;
        END IF;

        IF target_id IS NOT NULL THEN
            UPDATE branch_combo_item_prices SET price = override.price WHERE id = target_id;
        ELSE
            INSERT INTO branch_combo_item_prices (tenant_id, branch_id, combo_id, product_id, service_id, price)
            VALUES (p_tenant_id, p_branch_id, p_combo_id, override.product_id, override.service_id, override.price);
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
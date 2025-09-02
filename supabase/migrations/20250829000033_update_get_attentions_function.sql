CREATE OR REPLACE FUNCTION public.get_attentions_with_details(
    p_tenant_id uuid,
    p_branch_id uuid DEFAULT NULL,
    p_user_id uuid DEFAULT NULL,
    p_status_filter text DEFAULT NULL,
    p_start_date timestamptz DEFAULT NULL,
    p_end_date timestamptz DEFAULT NULL
)
RETURNS TABLE(
    -- Attention fields
    id uuid,
    attention_datetime timestamptz,
    status text,
    notes text,
    -- Client fields
    clients json,
    -- Service fields
    attention_services json,
    -- Product fields
    attention_products json,
    -- Combo fields
    attention_combos json
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH base_attentions AS (
        SELECT a.id
        FROM attentions a
        WHERE a.tenant_id = p_tenant_id
          AND (p_branch_id IS NULL OR a.branch_id = p_branch_id)
          AND (p_status_filter IS NULL OR a.status = p_status_filter)
          AND (p_start_date IS NULL OR a.attention_datetime >= p_start_date)
          AND (p_end_date IS NULL OR a.attention_datetime <= p_end_date)
          AND (p_user_id IS NULL OR EXISTS (
              SELECT 1
              FROM attention_services aserv
              WHERE aserv.attention_id = a.id AND aserv.user_id = p_user_id
          ))
    )
    SELECT
        a.id,
        a.attention_datetime,
        a.status,
        a.notes,
        json_build_object(
            'id', c.id,
            'name', c.name,
            'phone', c.phone
        ) AS clients,
        (
            SELECT json_agg(
                json_build_object(
                    'id', s.id,
                    'service_id', s.service_id,
                    'service_price', s.service_price,
                    'status', s.status,
                    'notes', s.notes,
                    'user_id', s.user_id,
                    'start_time', s.start_time,
                    'end_time', s.end_time,
                    'is_parallel', s.is_parallel,
                    'attention_combo_id', s.attention_combo_id,
                    'services', json_build_object('name', serv.name, 'duration_minutes', serv.duration_minutes),
                    'users', json_build_object('first_name', u.first_name, 'last_name', u.last_name),
                    'status_history', (
                        SELECT json_agg(
                            json_build_object(
                                'status', h.status,
                                'created_at', h.created_at
                            ) ORDER BY h.created_at ASC
                        )
                        FROM attention_service_status_history h
                        WHERE h.attention_service_id = s.id
                    )
                )
            )
            FROM attention_services s
            LEFT JOIN services serv ON s.service_id = serv.id
            LEFT JOIN users u ON s.user_id = u.id
            WHERE s.attention_id = a.id
        ) AS attention_services,
        (
            SELECT json_agg(
                json_build_object(
                    'id', p.id,
                    'product_id', p.product_id,
                    'quantity', p.quantity,
                    'unit_price', p.unit_price,
                    'total_price', p.total_price,
                    'notes', p.notes,
                    'user_id', p.user_id,
                    'attention_combo_id', p.attention_combo_id,
                    'products', json_build_object('name', prod.name),
                    'users', json_build_object('first_name', u.first_name, 'last_name', u.last_name)
                )
            )
            FROM attention_products p
            LEFT JOIN products prod ON p.product_id = prod.id
            LEFT JOIN users u ON p.user_id = u.id
            WHERE p.attention_id = a.id
        ) AS attention_products,
        (
            SELECT json_agg(
                json_build_object(
                    'id', ac.id,
                    'combo_id', ac.combo_id,
                    'price', ac.price,
                    'quantity', ac.quantity,
                    'status', ac.status,
                    'user_id', ac.user_id,
                    'combos', json_build_object(
                        'name', cmb.name,
                        'combo_items', (
                            SELECT json_agg(
                                json_build_object(
                                    'service_id', ci.service_id,
                                    'product_id', ci.product_id,
                                    'quantity', ci.quantity,
                                    'service', json_build_object('name', srv.name, 'duration_minutes', srv.duration_minutes),
                                    'product', json_build_object('name', prd.name)
                                )
                            )
                            FROM combo_items ci
                            LEFT JOIN services srv ON ci.service_id = srv.id
                            LEFT JOIN products prd ON ci.product_id = prd.id
                            WHERE ci.combo_id = ac.combo_id
                        )
                    ),
                    'users', json_build_object('first_name', u.first_name, 'last_name', u.last_name)
                )
            )
            FROM attention_combos ac
            LEFT JOIN combos cmb ON ac.combo_id = cmb.id
            LEFT JOIN users u ON ac.user_id = u.id
            WHERE ac.attention_id = a.id
        ) AS attention_combos
    FROM base_attentions ba
    JOIN attentions a ON ba.id = a.id
    LEFT JOIN clients c ON a.client_id = c.id
    ORDER BY a.attention_datetime;
END;
$$;

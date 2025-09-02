-- Migration to fix the "missing FROM-clause entry for table ba" error in the get_attentions_with_details RPC.

DROP FUNCTION IF EXISTS public.get_attentions_with_details(uuid, uuid, uuid, text, timestamptz, timestamptz);

CREATE OR REPLACE FUNCTION public.get_attentions_with_details(
    p_tenant_id uuid,
    p_branch_id uuid DEFAULT NULL,
    p_user_id uuid DEFAULT NULL,
    p_status_filter text DEFAULT NULL,
    p_start_date timestamptz DEFAULT NULL,
    p_end_date timestamptz DEFAULT NULL
)
RETURNS TABLE(
    id uuid,
    attention_datetime timestamptz,
    status text,
    notes text,
    total_duration_minutes integer,
    clients json,
    attention_services json,
    attention_products json,
    attention_combos json
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH 
    distinct_users AS (
        SELECT DISTINCT ON (user_id) *
        FROM get_tenant_users(p_tenant_id)
    ),
    base_attentions AS (
        SELECT 
            a.id
        FROM attentions a
        WHERE a.tenant_id = p_tenant_id
          AND (p_branch_id IS NULL OR p_branch_id::text = 'all' OR a.branch_id = p_branch_id)
          AND (p_status_filter IS NULL OR p_status_filter = 'all' OR a.status = p_status_filter)
          AND (p_start_date IS NULL OR a.attention_datetime >= p_start_date)
          AND (p_end_date IS NULL OR a.attention_datetime < (p_end_date::date + interval '1 day'))
          AND (
              p_user_id IS NULL OR p_user_id::text = 'all' OR EXISTS (
                  SELECT 1
                  FROM attention_services aserv
                  WHERE aserv.attention_id = a.id AND aserv.user_id = p_user_id
              ) OR EXISTS (
                  SELECT 1
                  FROM attention_combos acmb
                  WHERE acmb.attention_id = a.id AND acmb.user_id = p_user_id
              )
          )
    ),
    attention_durations AS (
        WITH service_details AS (
            SELECT 
                s.attention_id,
                s.is_parallel,
                COALESCE(s.duration_minutes, serv.duration_minutes, 0) as duration_minutes,
                s.service_order,
                s.id as attention_service_id
            FROM attention_services s
            JOIN services serv ON s.service_id = serv.id
            WHERE s.attention_id IN (SELECT id FROM base_attentions) -- Corrected: Removed "ba" alias
        ),
        timeline AS (
            SELECT
                attention_id,
                LAG(
                    SUM(CASE WHEN NOT is_parallel THEN duration_minutes ELSE 0 END) OVER (PARTITION BY attention_id ORDER BY service_order, attention_service_id),
                    1, 0
                ) OVER (PARTITION BY attention_id ORDER BY service_order, attention_service_id) 
                + duration_minutes as end_offset
            FROM service_details
        )
        SELECT
            attention_id,
            COALESCE(MAX(end_offset), 0) AS calculated_duration
        FROM timeline
        GROUP BY attention_id
    )
    SELECT
        a.id,
        a.attention_datetime,
        a.status,
        a.notes,
        ad.calculated_duration::integer AS total_duration_minutes,
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
                    'attention_combo_id', s.combo_id,
                    'duration_minutes', COALESCE(s.duration_minutes, serv.duration_minutes),
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
            LEFT JOIN distinct_users u ON s.user_id = u.user_id
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
                    'user_id', p.user_id,
                    'attention_combo_id', p.combo_id,
                    'products', json_build_object('name', prod.name),
                    'users', json_build_object('first_name', u.first_name, 'last_name', u.last_name)
                )
            )
            FROM attention_products p
            LEFT JOIN products prod ON p.product_id = prod.id
            LEFT JOIN distinct_users u ON p.user_id = u.user_id
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
                    'users', json_build_object('first_name', u.first_name, 'last_name', u.last_name),
                    'combos', json_build_object(
                        'name', cmb.name,
                        'combo_items', (
                            SELECT json_agg(
                                json_build_object(
                                    'service_id', ci.service_id,
                                    'product_id', ci.product_id,
                                    'quantity', ci.quantity,
                                    'services', json_build_object('name', srv.name, 'duration_minutes', srv.duration_minutes),
                                    'products', json_build_object('name', prd.name)
                                )
                            )
                            FROM combo_items ci
                            LEFT JOIN services srv ON ci.service_id = srv.id
                            LEFT JOIN products prd ON ci.product_id = prd.id
                            WHERE ci.combo_id = ac.combo_id
                        )
                    )
                )
            )
            FROM attention_combos ac
            LEFT JOIN combos cmb ON ac.combo_id = cmb.id
            LEFT JOIN distinct_users u ON ac.user_id = u.user_id
            WHERE ac.attention_id = a.id
        ) AS attention_combos
    FROM
        attentions a
    JOIN
        base_attentions ba ON a.id = ba.id
    LEFT JOIN
        clients c ON a.client_id = c.id
    LEFT JOIN
        attention_durations ad ON a.id = ad.attention_id
    ORDER BY
        a.attention_datetime;
END;
$$;

-- Update the get_dashboard_stats RPC function to accept optional branch_id and user_id parameters.
-- This allows for filtering statistics based on a specific branch or user.

CREATE OR REPLACE FUNCTION public.get_dashboard_stats(
  p_tenant_id uuid,
  p_branch_id uuid DEFAULT NULL, -- Optional branch filter
  p_user_id uuid DEFAULT NULL    -- Optional user filter (for stylist-specific stats)
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    v_stats jsonb;
BEGIN
    -- Base query for attentions, applying tenant and branch filters
    WITH base_attentions AS (
        SELECT
            id,
            total_amount,
            attention_date,
            status
        FROM public.attentions
        WHERE tenant_id = p_tenant_id
          AND (p_branch_id IS NULL OR branch_id = p_branch_id)
          AND (p_user_id IS NULL OR EXISTS (
            SELECT 1 FROM public.attention_services
            WHERE attention_id = attentions.id AND user_id = p_user_id
          ))
    ),
    daily_revenue AS (
        SELECT 
            COALESCE(SUM(total_amount), 0) as revenue,
            attention_date
        FROM base_attentions
        WHERE status IN ('Completada', 'Pagada')
        GROUP BY attention_date
    ),
    monthly_attentions AS (
        SELECT
            COALESCE(COUNT(*), 0) as count,
            date_trunc('month', attention_date) as month
        FROM base_attentions
        GROUP BY month
    )
    SELECT jsonb_build_object(
        'todayRevenue', (SELECT revenue FROM daily_revenue WHERE attention_date = CURRENT_DATE),
        'monthlyRevenue', (SELECT COALESCE(SUM(total_amount), 0) FROM base_attentions WHERE status IN ('Completada', 'Pagada') AND date_trunc('month', attention_date) = date_trunc('month', CURRENT_DATE)),
        'todayAppointments', (SELECT COALESCE(COUNT(*), 0) FROM base_attentions WHERE attention_date = CURRENT_DATE),
        'activeStylists', (
            SELECT COUNT(DISTINCT user_id)
            FROM get_tenant_users(p_tenant_id) gtu
            WHERE gtu.status = 'active'
              AND (p_branch_id IS NULL OR gtu.branch_id = p_branch_id) -- Filter stylists by branch if p_branch_id is provided
        ),
        'averageDuration', (SELECT COALESCE(AVG(duration_minutes), 0) FROM public.service_sessions WHERE tenant_id = p_tenant_id AND (p_branch_id IS NULL OR branch_id = p_branch_id) AND (p_user_id IS NULL OR user_id = p_user_id)),
        'revenueChange', (SELECT COALESCE((today.revenue - yesterday.revenue) / NULLIF(yesterday.revenue, 0) * 100, 0) FROM daily_revenue today, daily_revenue yesterday WHERE today.attention_date = CURRENT_DATE AND yesterday.attention_date = CURRENT_DATE - INTERVAL '1 day'),
        'appointmentsChange', (SELECT COALESCE((today.count - yesterday.count) / NULLIF(yesterday.count, 0) * 100, 0) FROM monthly_attentions today, monthly_attentions yesterday WHERE today.month = date_trunc('month', CURRENT_DATE) AND yesterday.month = date_trunc('month', CURRENT_DATE) - INTERVAL '1 month'),
        'monthlyRevenueChange', (SELECT COALESCE((this_month.revenue - last_month.revenue) / NULLIF(last_month.revenue, 0) * 100, 0) FROM (SELECT COALESCE(SUM(total_amount), 0) as revenue FROM base_attentions WHERE status IN ('Completada', 'Pagada') AND date_trunc('month', attention_date) = date_trunc('month', CURRENT_DATE)) this_month, (SELECT COALESCE(SUM(total_amount), 0) as revenue FROM base_attentions WHERE status IN ('Completada', 'Pagada') AND date_trunc('month', attention_date) = date_trunc('month', CURRENT_DATE) - INTERVAL '1 month') last_month)
    ) INTO v_stats;

    RETURN v_stats;
END;
$$;

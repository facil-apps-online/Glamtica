CREATE OR REPLACE FUNCTION get_api_health_stats()
RETURNS JSON
LANGUAGE sql
AS $$
WITH metrics_last_hour AS (
    SELECT
        response_time_ms,
        status_code,
        created_at
    FROM public.api_request_metrics
    WHERE created_at >= now() - interval '60 minutes'
),
rpm_data AS (
    SELECT
        date_trunc('minute', created_at) AS time_bucket,
        count(*) AS request_count
    FROM metrics_last_hour
    GROUP BY time_bucket
    ORDER BY time_bucket
)
SELECT json_build_object(
    'avg_latency_ms', (SELECT COALESCE(avg(response_time_ms), 0) FROM metrics_last_hour),
    'error_rate_percentage', (
        SELECT COALESCE(
            (count(*) FILTER (WHERE status_code >= 500) * 100.0) / NULLIF(count(*), 0),
            0
        )
        FROM metrics_last_hour
    ),
    'requests_per_minute', (SELECT COALESCE(json_agg(rpm_data), '[]'::json) FROM rpm_data)
);
$$;
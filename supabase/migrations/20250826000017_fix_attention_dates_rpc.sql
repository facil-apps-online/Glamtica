DROP FUNCTION IF EXISTS public.get_attention_dates(uuid, uuid);

CREATE OR REPLACE FUNCTION public.get_attention_datetimes(
    p_branch_id uuid,
    p_user_id uuid DEFAULT NULL
)
RETURNS TABLE(attention_datetime timestamptz, status text)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.attention_datetime,
        a.status
    FROM
        public.attentions a
    WHERE
        a.branch_id = p_branch_id
        AND (p_user_id IS NULL OR EXISTS (
            SELECT 1
            FROM public.attention_services s
            WHERE s.attention_id = a.id AND s.user_id = p_user_id
        ));
END;
$$;

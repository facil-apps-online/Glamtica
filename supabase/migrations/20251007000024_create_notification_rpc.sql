-- supabase/migrations/20251007000024_create_notification_rpc.sql

-- Crea la función para insertar notificaciones
-- Se define con SECURITY DEFINER para que pueda saltarse RLS y ser llamada por el sistema.
-- Esto es seguro porque la función solo realiza un INSERT con los datos que se le pasan.
CREATE OR REPLACE FUNCTION public.create_notification(
    p_tenant_id uuid,
    p_user_id uuid,
    p_type public.notification_type,
    p_title text,
    p_body text,
    p_link_to text
)
RETURNS void AS $$
BEGIN
    INSERT INTO public.notifications (tenant_id, user_id, type, title, body, link_to)
    VALUES (p_tenant_id, p_user_id, p_type, p_title, p_body, p_link_to);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.create_notification IS 'Crea una nueva notificación para un usuario específico dentro de un tenant. Debe ser llamada por un rol con privilegios elevados, como service_role, a través de una Edge Function.';

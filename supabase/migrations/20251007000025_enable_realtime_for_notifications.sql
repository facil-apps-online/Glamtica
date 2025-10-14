-- supabase/migrations/20251007000025_enable_realtime_for_notifications.sql

-- Habilita la transmisión de cambios en la tabla de notificaciones a través de Supabase Realtime.
-- Esto es necesario para que los clientes puedan suscribirse a los cambios (nuevas notificaciones) en tiempo real.

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

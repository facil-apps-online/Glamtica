-- Elimina la función RPC para crear tokens de reseteo de contraseña,
-- ya que ha sido reemplazada por la Edge Function genérica 'user-actions'.
DROP FUNCTION IF EXISTS public.create_password_reset_token(TEXT);

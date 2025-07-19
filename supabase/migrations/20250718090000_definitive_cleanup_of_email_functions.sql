-- Limpieza definitiva de todas las funciones de envío de correo para re-arquitecturar.
-- Esto asegura que no queden versiones antiguas o rotas en la base de datos.

DROP FUNCTION IF EXISTS public.trigger_system_email(UUID, TEXT, JSONB);
DROP FUNCTION IF EXISTS private.send_email_via_gmail_api(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS private.refresh_and_get_gmail_token();
DROP FUNCTION IF EXISTS public.trigger_test_email_for_tenant(UUID);
DROP FUNCTION IF EXISTS public.trigger_test_email();

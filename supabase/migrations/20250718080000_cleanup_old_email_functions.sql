-- Limpiar las funciones de base de datos que serán reemplazadas por la Edge Function.
DROP FUNCTION IF EXISTS public.trigger_system_email(UUID, TEXT, JSONB);
DROP FUNCTION IF EXISTS private.send_email_via_gmail_api(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS private.refresh_and_get_gmail_token();
DROP FUNCTION IF EXISTS public.trigger_test_email_for_tenant(UUID);

-- Migración final para eliminar las funciones de cifrado inseguras.

DROP FUNCTION IF EXISTS public.encrypt_secret(TEXT);
DROP FUNCTION IF EXISTS public.decrypt_secret(TEXT);

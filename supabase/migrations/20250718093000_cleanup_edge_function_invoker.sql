-- Limpieza de la función RPC que invoca a la Edge Function, ya que no es necesaria.
DROP FUNCTION IF EXISTS public.trigger_test_email();

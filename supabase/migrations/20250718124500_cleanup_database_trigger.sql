-- Limpieza final del trigger de la cola de correos, ya que la invocación se hará desde el cliente.
DROP TRIGGER IF EXISTS on_new_email_job ON public.email_queue;
DROP FUNCTION IF EXISTS private.notify_email_queue_worker();


-- Crear bucket para evidencias fotográficas
INSERT INTO storage.buckets (id, name, public) 
VALUES ('appointment-evidence', 'appointment-evidence', true);

-- Crear tabla para evidencias fotográficas
CREATE TABLE public.appointment_evidence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES public.appointment_sessions(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by UUID REFERENCES public.stylists(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para mejor rendimiento
CREATE INDEX idx_appointment_evidence_appointment_id ON public.appointment_evidence(appointment_id);
CREATE INDEX idx_appointment_evidence_session_id ON public.appointment_evidence(session_id);

-- Trigger para updated_at
CREATE TRIGGER trigger_appointment_evidence_updated_at
  BEFORE UPDATE ON public.appointment_evidence
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Política de seguridad para el bucket de evidencias (público para lectura, autenticado para escritura)
CREATE POLICY "Public can view evidence files" ON storage.objects
  FOR SELECT USING (bucket_id = 'appointment-evidence');

CREATE POLICY "Authenticated users can upload evidence files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'appointment-evidence');

CREATE POLICY "Users can update their own evidence files" ON storage.objects
  FOR UPDATE USING (bucket_id = 'appointment-evidence');

CREATE POLICY "Users can delete their own evidence files" ON storage.objects
  FOR DELETE USING (bucket_id = 'appointment-evidence');

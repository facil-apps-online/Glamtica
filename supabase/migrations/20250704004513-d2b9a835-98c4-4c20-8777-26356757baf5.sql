-- Reestructuración del sistema de citas para manejar atenciones con múltiples servicios

-- Crear tabla de atenciones (antes appointments)
CREATE TABLE public.attentions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  attention_date DATE NOT NULL,
  attention_time TIME WITHOUT TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'Confirmada',
  notes TEXT,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla de servicios de atención (reemplaza appointments y appointment_extra_services)
CREATE TABLE public.attention_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  attention_id UUID NOT NULL REFERENCES public.attentions(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  stylist_id UUID NOT NULL REFERENCES public.stylists(id) ON DELETE CASCADE,
  service_price NUMERIC NOT NULL,
  service_order INTEGER NOT NULL DEFAULT 1, -- Para ordenar los servicios
  status TEXT NOT NULL DEFAULT 'Pendiente', -- Pendiente, En Proceso, Completado
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla de sesiones de servicios (reemplaza appointment_sessions y extra_service_sessions)
CREATE TABLE public.service_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  attention_service_id UUID NOT NULL REFERENCES public.attention_services(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla de evidencia de servicios (reemplaza appointment_evidence)
CREATE TABLE public.service_evidence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_session_id UUID NOT NULL REFERENCES public.service_sessions(id) ON DELETE CASCADE,
  attention_id UUID NOT NULL REFERENCES public.attentions(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by UUID REFERENCES public.stylists(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla de productos de atención (reemplaza appointment_products)
CREATE TABLE public.attention_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  attention_id UUID NOT NULL REFERENCES public.attentions(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS en todas las nuevas tablas
ALTER TABLE public.attentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attention_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attention_products ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS permisivas para todas las operaciones
CREATE POLICY "Enable all operations for attentions" 
ON public.attentions FOR ALL USING (true);

CREATE POLICY "Enable all operations for attention_services" 
ON public.attention_services FOR ALL USING (true);

CREATE POLICY "Enable all operations for service_sessions" 
ON public.service_sessions FOR ALL USING (true);

CREATE POLICY "Enable all operations for service_evidence" 
ON public.service_evidence FOR ALL USING (true);

CREATE POLICY "Enable all operations for attention_products" 
ON public.attention_products FOR ALL USING (true);

-- Crear triggers para actualizar timestamps
CREATE TRIGGER update_attentions_updated_at
  BEFORE UPDATE ON public.attentions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_attention_services_updated_at
  BEFORE UPDATE ON public.attention_services
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_service_sessions_updated_at
  BEFORE UPDATE ON public.service_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_service_evidence_updated_at
  BEFORE UPDATE ON public.service_evidence
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_attention_products_updated_at
  BEFORE UPDATE ON public.attention_products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Crear trigger para calcular duración de sesiones
CREATE TRIGGER calculate_service_session_duration
  BEFORE UPDATE ON public.service_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_session_duration();

-- Crear índices para mejorar performance
CREATE INDEX idx_attentions_date ON public.attentions(attention_date);
CREATE INDEX idx_attention_services_attention_id ON public.attention_services(attention_id);
CREATE INDEX idx_attention_services_stylist_id ON public.attention_services(stylist_id);
CREATE INDEX idx_service_sessions_attention_service_id ON public.service_sessions(attention_service_id);
CREATE INDEX idx_service_evidence_session_id ON public.service_evidence(service_session_id);

-- Migrar datos existentes de appointments a attentions
INSERT INTO public.attentions (id, client_id, attention_date, attention_time, status, notes, total_amount, created_at, updated_at)
SELECT id, client_id, appointment_date, appointment_time, status, notes, total_price, created_at, updated_at
FROM public.appointments;

-- Migrar el servicio principal de cada appointment a attention_services
INSERT INTO public.attention_services (attention_id, service_id, stylist_id, service_price, service_order, status, created_at, updated_at)
SELECT a.id, a.service_id, a.stylist_id, s.price, 1, 
  CASE 
    WHEN a.status = 'Completada' THEN 'Completado'
    WHEN a.status = 'En Proceso' THEN 'En Proceso'
    ELSE 'Pendiente'
  END,
  a.created_at, a.updated_at
FROM public.appointments a
JOIN public.services s ON a.service_id = s.id;

-- Migrar servicios extras a attention_services
INSERT INTO public.attention_services (attention_id, service_id, stylist_id, service_price, service_order, status, created_at, updated_at)
SELECT aes.appointment_id, aes.service_id, aes.stylist_id, aes.price, 
  ROW_NUMBER() OVER (PARTITION BY aes.appointment_id ORDER BY aes.created_at) + 1,
  'Pendiente',
  aes.created_at, aes.updated_at
FROM public.appointment_extra_services aes;

-- Migrar sesiones principales a service_sessions
INSERT INTO public.service_sessions (attention_service_id, started_at, ended_at, duration_minutes, notes, created_at, updated_at)
SELECT ats.id, aps.started_at, aps.ended_at, aps.duration_minutes, aps.notes, aps.created_at, aps.updated_at
FROM public.appointment_sessions aps
JOIN public.attention_services ats ON aps.appointment_id = ats.attention_id AND ats.service_order = 1;

-- Migrar sesiones de servicios extras a service_sessions
INSERT INTO public.service_sessions (attention_service_id, started_at, ended_at, duration_minutes, notes, created_at, updated_at)
SELECT ats.id, ess.started_at, ess.ended_at, ess.duration_minutes, ess.notes, ess.created_at, ess.updated_at
FROM public.extra_service_sessions ess
JOIN public.appointment_extra_services aes ON ess.extra_service_id = aes.id
JOIN public.attention_services ats ON aes.appointment_id = ats.attention_id AND aes.service_id = ats.service_id AND aes.stylist_id = ats.stylist_id
WHERE ats.service_order > 1;

-- Migrar productos a attention_products
INSERT INTO public.attention_products (attention_id, product_id, quantity, unit_price, total_price, created_at, updated_at)
SELECT appointment_id, product_id, quantity, unit_price, total_price, created_at, updated_at
FROM public.appointment_products;

-- Migrar evidencia a service_evidence (esto requiere mapear las sesiones correctamente)
INSERT INTO public.service_evidence (service_session_id, attention_id, file_path, file_name, file_size, mime_type, uploaded_by, created_at, updated_at)
SELECT ss.id, ss_ats.attention_id, ae.file_path, ae.file_name, ae.file_size, ae.mime_type, ae.uploaded_by, ae.created_at, ae.updated_at
FROM public.appointment_evidence ae
JOIN public.service_sessions ss ON (
  (ae.session_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.appointment_sessions aps 
    WHERE aps.id = ae.session_id 
    AND aps.appointment_id IN (
      SELECT attention_id FROM public.attention_services WHERE id = ss.attention_service_id
    )
  )) OR
  (ae.extra_service_session_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.extra_service_sessions ess
    WHERE ess.id = ae.extra_service_session_id
    AND ess.appointment_id IN (
      SELECT attention_id FROM public.attention_services WHERE id = ss.attention_service_id
    )
  ))
)
JOIN public.attention_services ss_ats ON ss.attention_service_id = ss_ats.id;
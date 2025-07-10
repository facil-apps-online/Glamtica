
-- Crear tabla de clientes
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla de estilistas
CREATE TABLE public.stylists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  specialties TEXT[],
  phone TEXT,
  email TEXT,
  commission_rate DECIMAL(5,2) DEFAULT 50.00,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla de servicios
CREATE TABLE public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  duration_minutes INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla de citas
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) NOT NULL,
  stylist_id UUID REFERENCES public.stylists(id) NOT NULL,
  service_id UUID REFERENCES public.services(id) NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status TEXT DEFAULT 'Confirmada' CHECK (status IN ('Confirmada', 'En Proceso', 'Completada', 'Cancelada')),
  notes TEXT,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insertar algunos datos de ejemplo
INSERT INTO public.clients (name, phone, email) VALUES
('María González', '+34 666 123 456', 'maria@email.com'),
('Carlos Ruiz', '+34 666 789 012', 'carlos@email.com'),
('Laura García', '+34 666 345 678', 'laura@email.com');

INSERT INTO public.stylists (name, specialties, phone, email, commission_rate) VALUES
('Ana Martín', ARRAY['Corte', 'Tinte', 'Peinado'], '+34 666 111 222', 'ana@salon.com', 55.00),
('Pedro López', ARRAY['Corte Masculino', 'Barba'], '+34 666 333 444', 'pedro@salon.com', 50.00),
('Carmen Vila', ARRAY['Manicure', 'Pedicure', 'Uñas'], '+34 666 555 666', 'carmen@salon.com', 45.00);

INSERT INTO public.services (name, description, price, duration_minutes) VALUES
('Corte y Tinte', 'Corte de cabello y aplicación de tinte', 85.00, 90),
('Corte Masculino', 'Corte de cabello para hombre', 25.00, 30),
('Manicure', 'Cuidado completo de uñas de manos', 35.00, 45),
('Peinado', 'Peinado especial para eventos', 45.00, 60),
('Barba', 'Recorte y arreglo de barba', 15.00, 20);

INSERT INTO public.appointments (client_id, stylist_id, service_id, appointment_date, appointment_time, status, total_price) VALUES
((SELECT id FROM public.clients WHERE name = 'María González'), (SELECT id FROM public.stylists WHERE name = 'Ana Martín'), (SELECT id FROM public.services WHERE name = 'Corte y Tinte'), '2024-01-15', '09:00', 'Confirmada', 85.00),
((SELECT id FROM public.clients WHERE name = 'Carlos Ruiz'), (SELECT id FROM public.stylists WHERE name = 'Pedro López'), (SELECT id FROM public.services WHERE name = 'Corte Masculino'), '2024-01-15', '10:30', 'En Proceso', 25.00),
((SELECT id FROM public.clients WHERE name = 'Laura García'), (SELECT id FROM public.stylists WHERE name = 'Carmen Vila'), (SELECT id FROM public.services WHERE name = 'Manicure'), '2024-01-15', '11:00', 'Confirmada', 35.00);

-- Crear índices para mejorar el rendimiento
CREATE INDEX idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX idx_appointments_stylist ON public.appointments(stylist_id);
CREATE INDEX idx_appointments_client ON public.appointments(client_id);
CREATE INDEX idx_appointments_status ON public.appointments(status);

-- Habilitar Row Level Security (RLS) para todas las tablas
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stylists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS permisivas para desarrollo (pueden ajustarse más tarde)
CREATE POLICY "Enable all operations for clients" ON public.clients FOR ALL USING (true);
CREATE POLICY "Enable all operations for stylists" ON public.stylists FOR ALL USING (true);
CREATE POLICY "Enable all operations for services" ON public.services FOR ALL USING (true);
CREATE POLICY "Enable all operations for appointments" ON public.appointments FOR ALL USING (true);

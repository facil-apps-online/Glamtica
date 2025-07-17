/*
  # Sistema de Turnos y Permisos para Estilistas

  1. New Tables
    - `stylist_schedules` - Horarios de trabajo de los estilistas
    - `stylist_time_off` - Permisos y ausencias de los estilistas
    - `schedule_templates` - Plantillas de horarios reutilizables

  2. Security
    - Enable RLS on all new tables
    - Add policies for public access (development mode)

  3. Functions
    - Function to check stylist availability
    - Triggers for schedule validation
*/

-- Crear tabla de plantillas de horarios
CREATE TABLE IF NOT EXISTS schedule_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Crear tabla de horarios de estilistas
CREATE TABLE IF NOT EXISTS stylist_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stylist_id uuid NOT NULL REFERENCES stylists(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Domingo, 6=Sábado
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_active boolean DEFAULT true,
  template_id uuid REFERENCES schedule_templates(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(stylist_id, day_of_week)
);

-- Crear tabla de permisos y ausencias
CREATE TABLE IF NOT EXISTS stylist_time_off (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stylist_id uuid NOT NULL REFERENCES stylists(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  start_time time, -- Para permisos parciales
  end_time time,   -- Para permisos parciales
  type text NOT NULL CHECK (type IN ('vacation', 'sick', 'personal', 'training', 'other')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reason text,
  notes text,
  approved_by text, -- Podría ser el ID del administrador
  approved_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CHECK (end_date >= start_date),
  CHECK (
    (start_time IS NULL AND end_time IS NULL) OR 
    (start_time IS NOT NULL AND end_time IS NOT NULL AND end_time > start_time)
  )
);

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_stylist_schedules_stylist_id ON stylist_schedules(stylist_id);
CREATE INDEX IF NOT EXISTS idx_stylist_schedules_day_of_week ON stylist_schedules(day_of_week);
CREATE INDEX IF NOT EXISTS idx_stylist_time_off_stylist_id ON stylist_time_off(stylist_id);
CREATE INDEX IF NOT EXISTS idx_stylist_time_off_dates ON stylist_time_off(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_stylist_time_off_status ON stylist_time_off(status);

-- Triggers para updated_at
CREATE TRIGGER trigger_schedule_templates_updated_at
  BEFORE UPDATE ON schedule_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_stylist_schedules_updated_at
  BEFORE UPDATE ON stylist_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_stylist_time_off_updated_at
  BEFORE UPDATE ON stylist_time_off
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Función para verificar disponibilidad del estilista
CREATE OR REPLACE FUNCTION check_stylist_availability(
  p_stylist_id uuid,
  p_appointment_date date,
  p_appointment_time time,
  p_duration_minutes integer DEFAULT 60
)
RETURNS boolean AS $$
DECLARE
  v_day_of_week integer;
  v_schedule_exists boolean;
  v_schedule_start time;
  v_schedule_end time;
  v_appointment_end_time time;
  v_time_off_exists boolean;
BEGIN
  -- Obtener día de la semana (0=Domingo, 6=Sábado)
  v_day_of_week := EXTRACT(DOW FROM p_appointment_date);
  
  -- Calcular hora de finalización de la cita
  v_appointment_end_time := p_appointment_time + (p_duration_minutes || ' minutes')::interval;
  
  -- Verificar si el estilista tiene horario para ese día
  SELECT 
    EXISTS(SELECT 1 FROM stylist_schedules 
           WHERE stylist_id = p_stylist_id 
           AND day_of_week = v_day_of_week 
           AND is_active = true),
    start_time,
    end_time
  INTO v_schedule_exists, v_schedule_start, v_schedule_end
  FROM stylist_schedules 
  WHERE stylist_id = p_stylist_id 
  AND day_of_week = v_day_of_week 
  AND is_active = true;
  
  -- Si no tiene horario para ese día, no está disponible
  IF NOT v_schedule_exists THEN
    RETURN false;
  END IF;
  
  -- Verificar si la cita está dentro del horario de trabajo
  IF p_appointment_time < v_schedule_start OR v_appointment_end_time > v_schedule_end THEN
    RETURN false;
  END IF;
  
  -- Verificar si tiene permisos aprobados para esa fecha/hora
  SELECT EXISTS(
    SELECT 1 FROM stylist_time_off 
    WHERE stylist_id = p_stylist_id 
    AND status = 'approved'
    AND p_appointment_date >= start_date 
    AND p_appointment_date <= end_date
    AND (
      -- Permiso de día completo
      (start_time IS NULL AND end_time IS NULL) OR
      -- Permiso parcial que se solapa con la cita
      (start_time IS NOT NULL AND end_time IS NOT NULL AND 
       NOT (v_appointment_end_time <= start_time OR p_appointment_time >= end_time))
    )
  ) INTO v_time_off_exists;
  
  -- Si tiene permiso, no está disponible
  IF v_time_off_exists THEN
    RETURN false;
  END IF;
  
  -- Si pasa todas las validaciones, está disponible
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Insertar plantillas de horarios por defecto
INSERT INTO schedule_templates (name, description) VALUES 
('Tiempo Completo', 'Horario estándar de tiempo completo'),
('Medio Tiempo Mañana', 'Horario de medio tiempo en la mañana'),
('Medio Tiempo Tarde', 'Horario de medio tiempo en la tarde'),
('Fin de Semana', 'Horario solo fines de semana')
ON CONFLICT DO NOTHING;

-- Insertar horarios por defecto para estilistas existentes
DO $$
DECLARE
  stylist_record RECORD;
  template_id uuid;
BEGIN
  -- Obtener ID de plantilla de tiempo completo
  SELECT id INTO template_id FROM schedule_templates WHERE name = 'Tiempo Completo' LIMIT 1;
  
  -- Para cada estilista activo, crear horario de lunes a viernes
  FOR stylist_record IN SELECT id FROM stylists WHERE is_active = true LOOP
    -- Lunes a Viernes (1-5)
    FOR day_num IN 1..5 LOOP
      INSERT INTO stylist_schedules (stylist_id, day_of_week, start_time, end_time, template_id)
      VALUES (stylist_record.id, day_num, '09:00', '18:00', template_id)
      ON CONFLICT (stylist_id, day_of_week) DO NOTHING;
    END LOOP;
    
    -- Sábado (6)
    INSERT INTO stylist_schedules (stylist_id, day_of_week, start_time, end_time, template_id)
    VALUES (stylist_record.id, 6, '09:00', '15:00', template_id)
    ON CONFLICT (stylist_id, day_of_week) DO NOTHING;
  END LOOP;
END $$;

-- Habilitar RLS
ALTER TABLE schedule_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE stylist_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE stylist_time_off ENABLE ROW LEVEL SECURITY;

-- Políticas RLS permisivas para desarrollo
CREATE POLICY "Enable all operations for schedule_templates"
  ON schedule_templates FOR ALL TO public USING (true);

CREATE POLICY "Enable all operations for stylist_schedules"
  ON stylist_schedules FOR ALL TO public USING (true);

CREATE POLICY "Enable all operations for stylist_time_off"
  ON stylist_time_off FOR ALL TO public USING (true);
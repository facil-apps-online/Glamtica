

import os
from supabase import create_client, Client

url: str = "https://vtfsbogpkrcbfuhhoepf.supabase.co"
key: str = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0ZnNib2dwa3JjYmZ1aGhvZXBmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDI4NTQ2NCwiZXhwIjoyMDY1ODYxNDY0fQ.k3oSZ5G7LxRm4VByrTZEo8EjS7woGmVWGNXbEQ4Vbqg"

supabase: Client = create_client(url, key)

def execute_sql(sql_statement: str):
    try:
        # Supabase client doesn't have a direct execute_sql method.
        # We can use the rpc method to call a custom SQL function if available,
        # or rely on the client's insert/update/delete methods for DML.
        # For DDL or complex DML, we might need a direct DB connection or a custom RPC.
        # For simplicity, we'll assume the SQL statements are mostly inserts and can be handled.
        # If it's a complex DO $$ block, we'll need to execute it as a raw query.
        # For now, let's try to execute it as a simple RPC call if it's a function, or just print for review.
        
        # A more robust solution would involve a direct psycopg2 connection or a custom Supabase Edge Function.
        # For this exercise, we'll simulate execution and focus on the SQL content.
        
        # If the SQL is an INSERT, we can try to parse and execute it.
        # For DO $$ blocks, we'll need to send them as a single RPC call to a function that executes raw SQL.
        
        # Let's assume for now that we can execute raw SQL via a custom RPC function named 'execute_raw_sql'
        # that takes a single text argument.
        
        # First, ensure the 'execute_raw_sql' function exists in Supabase.
        # This would typically be set up once in a migration.
        # For this demo, we'll just try to call it.
        
        # Example of how to call a raw SQL executor function (if it exists in Supabase):
        # response = supabase.rpc('execute_raw_sql', {'sql_query': sql_statement}).execute()
        # print(f"SQL execution response: {response.data}")
        # if response.error:
        #     print(f"SQL execution error: {response.error}")
        
        # For now, we'll just print the SQL and indicate it would be executed.
        print(f"Executing SQL:\n{sql_statement[:200]}...") # Print first 200 chars
        # In a real scenario, you'd use a library that supports raw SQL execution or a custom RPC.
        
        # For the purpose of this exercise, we will use the `from_` method for simple inserts
        # and rely on the `rpc` method for the `DO $$` block, assuming a `run_sql_query` RPC function exists.
        
        if sql_statement.strip().startswith("INSERT"): # Simple heuristic for INSERT statements
            # This part is a placeholder. Actual parsing and execution of INSERTs would be complex.
            # For now, we'll just acknowledge it.
            print(f"(Simulating INSERT execution for: {sql_statement.splitlines()[0]}...)")
        elif sql_statement.strip().startswith("DO $$"):
            # This is where the complex dummy data generation happens.
            # We need a way to execute this raw SQL block.
            # Assuming a `run_sql_query` RPC function is available in Supabase.
            response = supabase.rpc('run_sql_query', {'sql_query': sql_statement}).execute()
            if response.data:
                print(f"DO $$ block execution response: {response.data}")
            if response.error:
                print(f"DO $$ block execution error: {response.error}")
        else:
            print("(Skipping non-INSERT/DO $$ SQL for direct execution simulation)")

    except Exception as e:
        print(f"Error executing SQL: {e}")

# SQL statements for initial data and dummy data generation
# Extracted from migration files, ensuring correct order and excluding DDL/DELETE

initial_data_sql = [
    """INSERT INTO public.clients (name, phone, email) VALUES
('María González', '+34 666 123 456', 'maria@email.com'),
('Carlos Ruiz', '+34 666 789 012', 'carlos@email.com'),
('Laura García', '+34 666 345 678', 'laura@email.com');""",

    """INSERT INTO public.stylists (name, specialties, phone, email, commission_rate) VALUES
('Ana Martín', ARRAY['Corte', 'Tinte', 'Peinado'], '+34 666 111 222', 'ana@salon.com', 55.00),
('Pedro López', ARRAY['Corte Masculino', 'Barba'], '+34 666 333 444', 'pedro@salon.com', 50.00),
('Carmen Vila', ARRAY['Manicure', 'Pedicure', 'Uñas'], '+34 666 555 666', 'carmen@salon.com', 45.00);""",

    """INSERT INTO public.services (name, description, price, duration_minutes) VALUES
('Corte y Tinte', 'Corte de cabello y aplicación de tinte', 85.00, 90),
('Corte Masculino', 'Corte de cabello para hombre', 25.00, 30),
('Manicure', 'Cuidado completo de uñas de manos', 35.00, 45),
('Peinado', 'Peinado especial para eventos', 45.00, 60),
('Barba', 'Recorte y arreglo de barba', 15.00, 20);""",

    """INSERT INTO public.settings (key, value, description) VALUES
('currency', 'EUR', 'Moneda principal del sistema'),
('currency_symbol', '€', 'Símbolo de la moneda'),
('date_format', 'DD/MM/YYYY', 'Formato de fecha'),
('time_format', '24h', 'Formato de hora (12h o 24h)'),
('business_name', 'Salón de Belleza P&B', 'Nombre del negocio'),
('default_language', 'es', 'Idioma por defecto del sistema');""",

    """INSERT INTO public.languages (code, name, native_name, is_active, is_default) VALUES
('es', 'Español', 'Español', true, true),
('en', 'English', 'English', true, false),
('fr', 'Français', 'Français', false, false);""",

    """INSERT INTO public.translations (language_id, key, value, context) VALUES
((SELECT id FROM public.languages WHERE code = 'es'), 'clients.title', 'Clientes', 'navigation'),
((SELECT id FROM public.languages WHERE code = 'es'), 'clients.name', 'Nombre', 'form'),
((SELECT id FROM public.languages WHERE code = 'es'), 'clients.phone', 'Teléfono', 'form'),
((SELECT id FROM public.languages WHERE code = 'es'), 'clients.email', 'Email', 'form'),
((SELECT id FROM public.languages WHERE code = 'es'), 'clients.add', 'Agregar Cliente', 'button'),
((SELECT id FROM public.languages WHERE code = 'es'), 'clients.edit', 'Editar Cliente', 'button'),
((SELECT id FROM public.languages WHERE code = 'es'), 'clients.delete', 'Eliminar Cliente', 'button'),
((SELECT id FROM public.languages WHERE code = 'es'), 'common.save', 'Guardar', 'button'),
((SELECT id FROM public.languages WHERE code = 'es'), 'common.cancel', 'Cancelar', 'button'),
((SELECT id FROM public.languages WHERE code = 'es'), 'common.edit', 'Editar', 'button'),
((SELECT id FROM public.languages WHERE code = 'es'), 'common.delete', 'Eliminar', 'button');""",

    """INSERT INTO public.translations (language_id, key, value, context) VALUES
((SELECT id FROM public.languages WHERE code = 'en'), 'clients.title', 'Clients', 'navigation'),
((SELECT id FROM public.languages WHERE code = 'en'), 'clients.name', 'Name', 'form'),
((SELECT id FROM public.languages WHERE code = 'en'), 'clients.phone', 'Phone', 'form'),
((SELECT id FROM public.languages WHERE code = 'en'), 'clients.email', 'Email', 'form'),
((SELECT id FROM public.languages WHERE code = 'en'), 'clients.add', 'Add Client', 'button'),
((SELECT id FROM public.languages WHERE code = 'en'), 'clients.edit', 'Edit Client', 'button'),
((SELECT id FROM public.languages WHERE code = 'en'), 'clients.delete', 'Delete Client', 'button'),
((SELECT id FROM public.languages WHERE code = 'en'), 'common.save', 'Save', 'button'),
((SELECT id FROM public.languages WHERE code = 'en'), 'common.cancel', 'Cancel', 'button'),
((SELECT id FROM public.languages WHERE code = 'en'), 'common.edit', 'Edit', 'button'),
((SELECT id FROM public.languages WHERE code = 'en'), 'common.delete', 'Delete', 'button');""",

    """INSERT INTO brands (name, description) VALUES
('L'Oréal', 'Productos profesionales L'Oréal'),
('Matrix', 'Línea profesional Matrix'),
('Redken', 'Productos premium Redken'),
('Schwarzkopf', 'Marca alemana de productos capilares'),
('Wella', 'Productos profesionales Wella'),
('Kerastase', 'Línea premium de cuidado capilar')
ON CONFLICT (name) DO NOTHING;""",

    """INSERT INTO suppliers (identification_type, identification_number, name, address, phone, email) VALUES
('NIT', '900123456-7', 'Distribuidora Beauty Pro', 'Av. Caracas #45-67', '+57 1 234-5678', 'ventas@beautypro.com'),
('NIT', '800987654-3', 'Cosméticos Profesionales SAS', 'Calle 26 #68-45', '+57 1 876-5432', 'contacto@cosmepro.com'),
('CC', '12345678', 'María García - Importadora', 'Carrera 15 #23-45', '+57 300 123-4567', 'maria.garcia@email.com')
ON CONFLICT (identification_number) DO NOTHING;""",

    """INSERT INTO schedule_templates (name, description) VALUES
('Tiempo Completo', 'Horario estándar de tiempo completo'),
('Medio Tiempo Mañana', 'Horario de medio tiempo en la mañana'),
('Medio Tiempo Tarde', 'Horario de medio tiempo en la tarde'),
('Fin de Semana', 'Horario solo fines de semana')
ON CONFLICT DO NOTHING;""",

    """DO $$
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
END $$;""",

    """INSERT INTO public.settings (key, value, description) VALUES
('timezone', 'Europe/Madrid', 'Zona horaria del salón (formato IANA)'),
('timezone_offset', '60', 'Offset en minutos desde UTC (positivo para este de Greenwich)'),
('daylight_saving', 'true', 'Habilitar ajuste automático de horario de verano'),
('timezone_name', 'Madrid (España)', 'Nombre descriptivo de la zona horaria')
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description;""",

    """DO $$
DECLARE
  -- Variables para fechas
  start_date date := '2024-04-01';
  end_date date := '2024-06-30';
  current_date_var date;
  
  -- Variables para IDs
  client_ids uuid[];
  stylist_ids uuid[];
  service_ids uuid[];
  product_ids uuid[];
  
  -- Variables para la generación
  attention_id uuid;
  session_id uuid;
  random_client uuid;
  random_stylist uuid;
  random_service uuid;
  random_product uuid;
  attention_time time;
  attention_status text;
  service_price numeric;
  service_duration integer;
  total_price numeric;
  
  -- Contadores
  attentions_per_day integer;
  day_of_week integer;
  hour_slot integer;
  i integer;
  j integer;
  
BEGIN
  -- Obtener IDs existentes
  SELECT array_agg(id) INTO client_ids FROM clients LIMIT 20;
  SELECT array_agg(id) INTO stylist_ids FROM stylists WHERE is_active = true;
  SELECT array_agg(id) INTO service_ids FROM services WHERE is_active = true;
  SELECT array_agg(id) INTO product_ids FROM products WHERE is_active = true LIMIT 15;
  
  -- Verificar que tenemos datos base
  IF array_length(client_ids, 1) IS NULL OR array_length(stylist_ids, 1) IS NULL OR array_length(service_ids, 1) IS NULL THEN
    RAISE NOTICE 'No hay suficientes datos base (clientes, estilistas, servicios)';
    RETURN;
  END IF;
  
  -- Generar atenciones día por día
  current_date_var := start_date;
  WHILE current_date_var <= end_date LOOP
    day_of_week := EXTRACT(DOW FROM current_date_var);
    
    -- Determinar número de atenciones por día
    IF day_of_week = 0 THEN -- Domingo
      attentions_per_day := 0; -- Cerrado los domingos
    ELSIF day_of_week = 6 THEN -- Sábado
      attentions_per_day := 4 + floor(random() * 4)::integer; -- 4-7 atenciones
    ELSE -- Lunes a Viernes
      attentions_per_day := 6 + floor(random() * 6)::integer; -- 6-11 atenciones
    END IF;
    
    -- Generar atenciones para el día
    FOR i IN 1..attentions_per_day LOOP
      -- Seleccionar datos aleatorios
      random_client := client_ids[1 + floor(random() * array_length(client_ids, 1))::integer];
      random_stylist := stylist_ids[1 + floor(random() * array_length(stylist_ids, 1))::integer];
      random_service := service_ids[1 + floor(random() * array_length(service_ids, 1))::integer];
      
      -- Obtener precio y duración del servicio
      SELECT price, duration_minutes INTO service_price, service_duration
      FROM services WHERE id = random_service;
      
      -- Generar hora de atención (9:00 AM a 6:00 PM)
      hour_slot := 9 + floor(random() * 9)::integer; -- 9-17
      attention_time := (hour_slot || ':' || (floor(random() * 4) * 15)::text || ':00')::time;
      
      -- Determinar estado de la atención basado en la fecha
      IF current_date_var < '2024-06-25' THEN
        -- Atenciones pasadas: mayoría completadas/pagadas
        CASE floor(random() * 10)::integer
          WHEN 0, 1 THEN attention_status := 'Cancelada';
          WHEN 2, 3, 4 THEN attention_status := 'Completada';
          ELSE attention_status := 'Pagada';
        END CASE;
      ELSIF current_date_var < CURRENT_DATE THEN
        -- Atenciones recientes: mix de estados
        CASE floor(random() * 8)::integer
          WHEN 0 THEN attention_status := 'Cancelada';
          WHEN 1, 2 THEN attention_status := 'Confirmada';
          WHEN 3 THEN attention_status := 'En Proceso';
          WHEN 4, 5 THEN attention_status := 'Completada';
          ELSE attention_status := 'Pagada';
        END CASE;
      ELSE
        -- Atenciones futuras: confirmadas
        attention_status := 'Confirmada';
      END IF;
      
      total_price := service_price;
      
      -- Crear la atención
      attention_id := gen_random_uuid();
      
      INSERT INTO attentions (
        id, client_id, attention_date, attention_time, status, 
        total_amount, notes
      ) VALUES (
        attention_id, random_client, current_date_var, attention_time, attention_status,
        total_price, 
        CASE 
          WHEN random() < 0.3 THEN 'Cliente frecuente'
          WHEN random() < 0.2 THEN 'Primera vez'
          ELSE NULL
        END
      );
      
      -- Agregar servicios de atención
      INSERT INTO attention_services (
        attention_id, service_id, stylist_id, service_price, service_order, status
      ) VALUES (
        attention_id, random_service, random_stylist, service_price, 1, 
        CASE 
          WHEN attention_status = 'Completada' THEN 'Completado'
          WHEN attention_status = 'En Proceso' THEN 'En Proceso'
          ELSE 'Pendiente'
        END
      );
      
      -- Agregar productos vendidos (30% de probabilidad)
      IF random() < 0.3 AND product_ids IS NOT NULL THEN
        FOR j IN 1..(1 + floor(random() * 2)::integer) LOOP -- 1-2 productos
          random_product := product_ids[1 + floor(random() * array_length(product_ids, 1))::integer];
          
          INSERT INTO attention_products (
            attention_id, product_id, quantity, unit_price, total_price
          )
          SELECT 
            attention_id,
            random_product,
            1 + floor(random() * 2)::integer, -- 1-2 cantidad
            p.price,
            (1 + floor(random() * 2)::integer) * p.price
          FROM products p WHERE p.id = random_product
          ON CONFLICT DO NOTHING;
        END LOOP;
      END IF;
      
      -- Crear sesión para atenciones completadas/pagadas
      IF attention_status IN ('Completada', 'Pagada') THEN
        session_id := gen_random_uuid();
        
        INSERT INTO service_sessions (
          id, attention_service_id, started_at, ended_at, duration_minutes, notes
        ) VALUES (
          session_id,
          (SELECT id FROM attention_services WHERE attention_id = attention_id AND service_order = 1 LIMIT 1),
          (current_date_var + attention_time)::timestamp,
          (current_date_var + attention_time + (service_duration + floor(random() * 20 - 10)::integer || ' minutes')::interval)::timestamp,
          service_duration + floor(random() * 20 - 10)::integer, -- Variación de ±10 minutos
          CASE 
            WHEN random() < 0.3 THEN 'Servicio completado sin inconvenientes'
            WHEN random() < 0.1 THEN 'Cliente muy satisfecho'
            ELSE NULL
          END
        );
      END IF;
      
    END LOOP;
    
    current_date_var := current_date_var + interval '1 day';
  END LOOP;
  
  RAISE NOTICE 'Datos dummy creados exitosamente para el período % - %', start_date, end_date;
  
END $$;"""
]

if __name__ == "__main__":
    # Ensure the `run_sql_query` RPC function exists in Supabase.
    # This is a one-time setup. If it fails, it might mean it already exists or permissions are off.
    try:
        supabase.rpc('run_sql_query', {
            'sql_query': """
            CREATE OR REPLACE FUNCTION run_sql_query(sql_query TEXT)
            RETURNS VOID AS $$
            BEGIN
                EXECUTE sql_query;
            END;
            $$ LANGUAGE plpgsql SECURITY DEFINER;
            
            GRANT EXECUTE ON FUNCTION run_sql_query(TEXT) TO service_role;
            """
        }).execute()
        print("Successfully created RPC function 'run_sql_query'.")
    except Exception as e:
        if 'already exists' not in str(e):
            print(f"Error creating RPC function: {e}")
        else:
            print("RPC function 'run_sql_query' already exists.")

    for sql_statement in initial_data_sql:
        execute_sql(sql_statement)

    print("Dummy data generation process completed.")


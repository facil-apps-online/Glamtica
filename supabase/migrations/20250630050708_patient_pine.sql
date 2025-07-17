/*
  # Limpiar datos existentes y generar datos dummy de citas

  1. Limpieza de datos
    - Elimina todas las evidencias de citas
    - Elimina todas las sesiones de citas
    - Elimina todos los productos de citas
    - Elimina todos los servicios extras de citas
    - Elimina todas las citas

  2. Generación de datos dummy
    - Período: 1 de abril a 30 de junio de 2024
    - Horarios realistas de trabajo
    - Estados de citas inteligentes basados en fechas
    - Productos y servicios extras aleatorios
    - Sesiones automáticas para citas completadas
*/

-- Limpiar datos existentes
DELETE FROM appointment_evidence;
DELETE FROM appointment_sessions;
DELETE FROM appointment_products;
DELETE FROM appointment_extra_services;
DELETE FROM appointments;

-- Función para generar datos dummy de citas
DO $$
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
  
  -- Default Tenant and Branch IDs (replace with actual values)
  v_default_tenant_id UUID := '60fbe916-6b20-4cfa-8378-abd6018251ea';
  v_default_branch_id UUID := 'fc7052bf-f01e-48d6-af0a-5dde9099c56a';

  -- Variables para la generación
  appointment_id uuid;
  session_id uuid;
  random_client uuid;
  random_stylist uuid;
  random_service uuid;
  random_product uuid;
  appointment_time time;
  appointment_status text;
  service_price numeric;
  service_duration integer;
  total_price numeric;
  
  -- Contadores
  appointments_per_day integer;
  day_of_week integer;
  hour_slot integer;
  i integer;
  j integer;
  
BEGIN
  -- Obtener IDs existentes
  SELECT array_agg(id) INTO client_ids FROM clients WHERE tenant_id = v_default_tenant_id AND branch_id = v_default_branch_id LIMIT 20;
  SELECT array_agg(id) INTO stylist_ids FROM stylists WHERE tenant_id = v_default_tenant_id AND branch_id = v_default_branch_id AND is_active = true;
  SELECT array_agg(id) INTO service_ids FROM services WHERE tenant_id = v_default_tenant_id AND branch_id = v_default_branch_id AND is_active = true;
  SELECT array_agg(id) INTO product_ids FROM products WHERE tenant_id = v_default_tenant_id AND branch_id = v_default_branch_id AND is_active = true LIMIT 15;
  
  -- Verificar que tenemos datos base
  IF array_length(client_ids, 1) IS NULL OR array_length(stylist_ids, 1) IS NULL OR array_length(service_ids, 1) IS NULL THEN
    RAISE NOTICE 'No hay suficientes datos base (clientes, estilistas, servicios) para el tenant/branch por defecto.';
    RETURN;
  END IF;
  
  -- Generar citas día por día
  current_date_var := start_date;
  WHILE current_date_var <= end_date LOOP
    day_of_week := EXTRACT(DOW FROM current_date_var);
    
    -- Determinar número de citas por día
    IF day_of_week = 0 THEN -- Domingo
      appointments_per_day := 0; -- Cerrado los domingos
    ELSIF day_of_week = 6 THEN -- Sábado
      appointments_per_day := 4 + floor(random() * 4)::integer; -- 4-7 citas
    ELSE -- Lunes a Viernes
      appointments_per_day := 6 + floor(random() * 6)::integer; -- 6-11 citas
    END IF;
    
    -- Generar citas para el día
    FOR i IN 1..appointments_per_day LOOP
      -- Seleccionar datos aleatorios
      random_client := client_ids[1 + floor(random() * array_length(client_ids, 1))::integer];
      random_stylist := stylist_ids[1 + floor(random() * array_length(stylist_ids, 1))::integer];
      random_service := service_ids[1 + floor(random() * array_length(service_ids, 1))::integer];
      
      -- Obtener precio y duración del servicio
      SELECT price, duration_minutes INTO service_price, service_duration
      FROM services WHERE id = random_service;
      
      -- Generar hora de cita (9:00 AM a 6:00 PM)
      hour_slot := 9 + floor(random() * 9)::integer; -- 9-17
      appointment_time := (hour_slot || ':' || (floor(random() * 4) * 15)::text || ':00')::time;
      
      -- Determinar estado de la cita basado en la fecha
      IF current_date_var < '2024-06-25' THEN
        -- Citas pasadas: mayoría completadas/pagadas
        CASE floor(random() * 10)::integer
          WHEN 0, 1 THEN appointment_status := 'Cancelada';
          WHEN 2, 3, 4 THEN appointment_status := 'Completada';
          ELSE appointment_status := 'Pagada';
        END CASE;
      ELSIF current_date_var < CURRENT_DATE THEN
        -- Citas recientes: mix de estados
        CASE floor(random() * 8)::integer
          WHEN 0 THEN appointment_status := 'Cancelada';
          WHEN 1, 2 THEN appointment_status := 'Confirmada';
          WHEN 3 THEN appointment_status := 'En Proceso';
          WHEN 4, 5 THEN appointment_status := 'Completada';
          ELSE appointment_status := 'Pagada';
        END CASE;
      ELSE
        -- Citas futuras: confirmadas
        appointment_status := 'Confirmada';
      END IF;
      
      total_price := service_price;
      
      -- Crear la cita
      appointment_id := gen_random_uuid();
      
      INSERT INTO appointments (
        id, client_id, stylist_id, service_id, 
        appointment_date, appointment_time, status, 
        total_price, notes, tenant_id, branch_id
      ) VALUES (
        appointment_id, random_client, random_stylist, random_service,
        current_date_var, appointment_time, appointment_status,
        total_price, 
        CASE 
          WHEN random() < 0.3 THEN 'Cliente frecuente'
          WHEN random() < 0.2 THEN 'Primera vez'
          ELSE NULL
        END,
        v_default_tenant_id, v_default_branch_id
      );
      
      -- Agregar productos vendidos (30% de probabilidad)
      IF random() < 0.3 AND product_ids IS NOT NULL THEN
        FOR j IN 1..(1 + floor(random() * 2)::integer) LOOP -- 1-2 productos
          random_product := product_ids[1 + floor(random() * array_length(product_ids, 1))::integer];
          
          INSERT INTO appointment_products (
            appointment_id, product_id, quantity, unit_price, total_price, tenant_id, branch_id
          )
          SELECT 
            appointment_id,
            random_product,
            1 + floor(random() * 2)::integer, -- 1-2 cantidad
            p.price,
            (1 + floor(random() * 2)::integer) * p.price,
            v_default_tenant_id, v_default_branch_id
          FROM products p WHERE p.id = random_product
          ON CONFLICT DO NOTHING;
        END LOOP;
      END IF;
      
      -- Agregar servicios extras (20% de probabilidad)
      IF random() < 0.2 AND array_length(service_ids, 1) > 1 THEN
        -- Seleccionar un servicio diferente al principal
        random_service := service_ids[1 + floor(random() * array_length(service_ids, 1))::integer];
        WHILE random_service = (SELECT service_id FROM appointments WHERE id = appointment_id) LOOP
          random_service := service_ids[1 + floor(random() * array_length(service_ids, 1))::integer];
        END LOOP;
        
        INSERT INTO appointment_extra_services (
          appointment_id, service_id, stylist_id, price, notes, tenant_id, branch_id
        )
        SELECT 
          appointment_id,
          random_service,
          random_stylist,
          s.price * 0.8, -- Precio con descuento para servicio extra
          'Servicio adicional',
          v_default_tenant_id, v_default_branch_id
        FROM services s WHERE s.id = random_service;
      END IF;
      
      -- Crear sesión para citas completadas/pagadas
      IF appointment_status IN ('Completada', 'Pagada') THEN
        session_id := gen_random_uuid();
        
        INSERT INTO appointment_sessions (
          id, appointment_id, started_at, ended_at, duration_minutes, notes, tenant_id, branch_id
        ) VALUES (
          session_id,
          appointment_id,
          (current_date_var + appointment_time)::timestamp,
          (current_date_var + appointment_time + (service_duration + floor(random() * 20 - 10)::integer || ' minutes')::interval)::timestamp,
          service_duration + floor(random() * 20 - 10)::integer, -- Variación de ±10 minutos
          CASE 
            WHEN random() < 0.3 THEN 'Servicio completado sin inconvenientes'
            WHEN random() < 0.1 THEN 'Cliente muy satisfecho'
            ELSE NULL
          END,
          v_default_tenant_id, v_default_branch_id
        );
      END IF;
      
    END LOOP;
    
    current_date_var := current_date_var + interval '1 day';
  END LOOP;
  
  RAISE NOTICE 'Datos dummy creados exitosamente para el período % - %', start_date, end_date;
  
END $;

-- Actualizar estadísticas de la base de datos
ANALYZE appointments;
ANALYZE appointment_sessions;
ANALYZE appointment_products;
ANALYZE appointment_extra_services;

-- Actualizar la restricción de estados para incluir "Pagada"
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_status_check;
ALTER TABLE appointments ADD CONSTRAINT appointments_status_check 
CHECK (status IN ('Confirmada', 'En Proceso', 'Completada', 'Pagada', 'Cancelada'));

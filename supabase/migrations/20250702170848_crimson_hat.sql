/*
  # Configuración de Zona Horaria

  1. New Settings
    - `timezone` - Zona horaria configurada (ej: 'America/New_York')
    - `timezone_offset` - Offset en minutos desde UTC
    - `daylight_saving` - Si está habilitado el horario de verano
    - `timezone_name` - Nombre descriptivo de la zona horaria

  2. Security
    - No RLS changes needed as settings table inherits existing security model
*/

-- Insertar configuraciones de zona horaria
INSERT INTO settings (key, value, description) VALUES 
('timezone', 'Europe/Madrid', 'Zona horaria del salón (formato IANA)'),
('timezone_offset', '60', 'Offset en minutos desde UTC (positivo para este de Greenwich)'),
('daylight_saving', 'true', 'Habilitar ajuste automático de horario de verano'),
('timezone_name', 'Madrid (España)', 'Nombre descriptivo de la zona horaria')
ON CONFLICT (key) DO UPDATE SET 
  value = EXCLUDED.value,
  description = EXCLUDED.description;
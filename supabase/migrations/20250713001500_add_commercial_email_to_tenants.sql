-- Migración para añadir la columna commercial_email que faltaba en la tabla tenants

ALTER TABLE tenants
ADD COLUMN commercial_email TEXT;

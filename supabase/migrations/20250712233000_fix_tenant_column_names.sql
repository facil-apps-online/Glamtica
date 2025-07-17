-- Migración para corregir nombres de columnas en la tabla tenants

-- Renombrar la columna de whatsapp para que coincida con el código de la aplicación
ALTER TABLE tenants RENAME COLUMN whatsapp_number TO whatsapp_phone;

-- Renombrar la columna de email de facturación para que coincida con el código de la aplicación
ALTER TABLE tenants RENAME COLUMN billing_email TO einvoicing_email;

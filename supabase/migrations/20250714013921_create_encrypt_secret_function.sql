-- Habilitar la extensión pgcrypto si aún no está habilitada
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "public";

-- Función para encriptar un valor de texto
CREATE OR REPLACE FUNCTION public.encrypt_secret(secret_value TEXT)
RETURNS TEXT AS $$
DECLARE
  encryption_key TEXT := 'TU_CLAVE_DE_ENCRIPTACION_SECRETA'; -- ¡CAMBIAR ESTO POR UNA VARIABLE DE ENTORNO!
BEGIN
  RETURN pgp_sym_encrypt(secret_value, encryption_key);
END;
$$ LANGUAGE plpgsql;

-- Función para desencriptar un valor de texto
CREATE OR REPLACE FUNCTION public.decrypt_secret(encrypted_value TEXT)
RETURNS TEXT AS $$
DECLARE
  encryption_key TEXT := 'TU_CLAVE_DE_ENCRIPTACION_SECRETA'; -- ¡CAMBIAR ESTO POR UNA VARIABLE DE ENTORNO!
BEGIN
  RETURN pgp_sym_decrypt(encrypted_value::bytea, encryption_key);
END;
$$ LANGUAGE plpgsql;

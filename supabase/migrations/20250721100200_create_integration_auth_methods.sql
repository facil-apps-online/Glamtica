CREATE TABLE integration_auth_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    method TEXT NOT NULL UNIQUE,
    description TEXT,
    config_schema JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS y definir políticas
ALTER TABLE integration_auth_methods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON integration_auth_methods FOR SELECT USING (true);
CREATE POLICY "Enable insert for superadmins" ON integration_auth_methods FOR INSERT WITH CHECK (is_super_admin());
CREATE POLICY "Enable update for superadmins" ON integration_auth_methods FOR UPDATE USING (is_super_admin());
CREATE POLICY "Enable delete for superadmins" ON integration_auth_methods FOR DELETE USING (is_super_admin());

-- Trigger para actualizar 'updated_at'
CREATE TRIGGER handle_updated_at
BEFORE UPDATE ON integration_auth_methods
FOR EACH ROW
EXECUTE PROCEDURE moddatetime (updated_at);

-- Insertar valores iniciales
INSERT INTO integration_auth_methods (method, description, config_schema) VALUES
('none', 'Sin autenticación. La solicitud se envía directamente.', NULL),
('bearer_token', 'Autenticación mediante un token "Bearer" en la cabecera Authorization.', 
    '{ "fields": [{ "name": "token_credential_key", "label": "Credencial del Token", "type": "credential_selector" }] }'),
('api_key_in_header', 'Autenticación mediante una clave de API en una cabecera personalizada.', 
    '{ "fields": [{ "name": "header_name", "label": "Nombre de la Cabecera", "type": "text" }, { "name": "key_credential_key", "label": "Credencial de la API Key", "type": "credential_selector" }] }'),
('basic_auth', 'Autenticación básica (usuario y contraseña) codificada en Base64.', 
    '{ "fields": [{ "name": "user_credential_key", "label": "Credencial del Usuario", "type": "credential_selector" }, { "name": "pass_credential_key", "label": "Credencial de la Contraseña", "type": "credential_selector" }] }')
ON CONFLICT (method) DO NOTHING;

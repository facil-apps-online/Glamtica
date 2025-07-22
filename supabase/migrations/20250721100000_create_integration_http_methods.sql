CREATE TABLE integration_http_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    method TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS y definir políticas
ALTER TABLE integration_http_methods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON integration_http_methods FOR SELECT USING (true);
CREATE POLICY "Enable insert for superadmins" ON integration_http_methods FOR INSERT WITH CHECK (is_super_admin());
CREATE POLICY "Enable update for superadmins" ON integration_http_methods FOR UPDATE USING (is_super_admin());
CREATE POLICY "Enable delete for superadmins" ON integration_http_methods FOR DELETE USING (is_super_admin());

-- Trigger para actualizar 'updated_at'
CREATE TRIGGER handle_updated_at
BEFORE UPDATE ON integration_http_methods
FOR EACH ROW
EXECUTE PROCEDURE moddatetime (updated_at);

-- Insertar valores iniciales
INSERT INTO integration_http_methods (method, description) VALUES
('POST', 'Para crear nuevos recursos.'),
('GET', 'Para obtener recursos existentes.'),
('PUT', 'Para reemplazar completamente un recurso existente.'),
('PATCH', 'Para actualizar parcialmente un recurso existente.'),
('DELETE', 'Para eliminar un recurso existente.')
ON CONFLICT (method) DO NOTHING;

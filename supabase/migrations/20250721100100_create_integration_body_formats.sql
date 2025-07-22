CREATE TABLE integration_body_formats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    format TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS y definir políticas
ALTER TABLE integration_body_formats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON integration_body_formats FOR SELECT USING (true);
CREATE POLICY "Enable insert for superadmins" ON integration_body_formats FOR INSERT WITH CHECK (is_super_admin());
CREATE POLICY "Enable update for superadmins" ON integration_body_formats FOR UPDATE USING (is_super_admin());
CREATE POLICY "Enable delete for superadmins" ON integration_body_formats FOR DELETE USING (is_super_admin());

-- Trigger para actualizar 'updated_at'
CREATE TRIGGER handle_updated_at
BEFORE UPDATE ON integration_body_formats
FOR EACH ROW
EXECUTE PROCEDURE moddatetime (updated_at);

-- Insertar valores iniciales
INSERT INTO integration_body_formats (format, description) VALUES
('json', 'JavaScript Object Notation. El cuerpo de la solicitud es un JSON.'),
('xml', 'Extensible Markup Language. El cuerpo de la solicitud es un XML (común en servicios SOAP).'),
('form-urlencoded', 'El cuerpo de la solicitud se codifica como pares clave-valor.')
ON CONFLICT (format) DO NOTHING;

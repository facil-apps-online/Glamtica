-- Tabla para almacenar las categorías de las integraciones
CREATE TABLE integration_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger para actualizar automáticamente el campo updated_at
CREATE TRIGGER handle_updated_at
BEFORE UPDATE ON integration_categories
FOR EACH ROW
EXECUTE PROCEDURE moddatetime (updated_at);

-- Habilitar Row Level Security (RLS)
ALTER TABLE integration_categories ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS:
-- Se permite el acceso a cualquier usuario autenticado.
-- La seguridad real se delega a la capa de aplicación.
CREATE POLICY "Enable access for authenticated users"
ON integration_categories
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
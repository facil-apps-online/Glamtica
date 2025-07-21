-- Tabla para almacenar las definiciones de los proveedores de integración
CREATE TABLE integration_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    logo_url TEXT,
    country_id UUID NOT NULL,
    category_id UUID NOT NULL,
    status TEXT NOT NULL,
    endpoints JSONB NOT NULL,
    config_schema JSONB NOT NULL,
    api_schema JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT fk_country
        FOREIGN KEY(country_id) 
        REFERENCES countries(id),
    
    CONSTRAINT fk_category
        FOREIGN KEY(category_id)
        REFERENCES integration_categories(id)
);

-- Trigger para actualizar automáticamente el campo updated_at
CREATE TRIGGER handle_updated_at
BEFORE UPDATE ON integration_providers
FOR EACH ROW
EXECUTE PROCEDURE moddatetime (updated_at);

-- Habilitar Row Level Security (RLS)
ALTER TABLE integration_providers ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS:
-- Se permite el acceso a cualquier usuario autenticado.
-- La seguridad real se delega a la capa de aplicación.
CREATE POLICY "Enable access for authenticated users"
ON integration_providers
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
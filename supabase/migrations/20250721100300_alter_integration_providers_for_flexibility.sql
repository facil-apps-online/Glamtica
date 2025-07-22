-- Alterar la tabla integration_providers para añadir las nuevas columnas y constraints

-- 1. Añadir las nuevas columnas que contendrán las FKs y la nueva data
ALTER TABLE public.integration_providers
    ADD COLUMN IF NOT EXISTS http_method_id UUID,
    ADD COLUMN IF NOT EXISTS body_format_id UUID,
    ADD COLUMN IF NOT EXISTS auth_method_id UUID,
    ADD COLUMN IF NOT EXISTS http_headers JSONB,
    ADD COLUMN IF NOT EXISTS authentication_config JSONB,
    ADD COLUMN IF NOT EXISTS body_template TEXT,
    ADD COLUMN IF NOT EXISTS response_mapping JSONB;

-- 2. Añadir las constraints de Foreign Key
ALTER TABLE public.integration_providers
    ADD CONSTRAINT fk_http_method FOREIGN KEY (http_method_id) REFERENCES integration_http_methods(id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_body_format FOREIGN KEY (body_format_id) REFERENCES integration_body_formats(id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_auth_method FOREIGN KEY (auth_method_id) REFERENCES integration_auth_methods(id) ON DELETE SET NULL;

-- 3. Comentarios sobre las nuevas columnas para claridad
COMMENT ON COLUMN public.integration_providers.http_method_id IS 'Método HTTP a utilizar para la solicitud (GET, POST, etc.).';
COMMENT ON COLUMN public.integration_providers.body_format_id IS 'Formato del cuerpo de la solicitud (json, xml, etc.).';
COMMENT ON COLUMN public.integration_providers.auth_method_id IS 'Método de autenticación a utilizar.';
COMMENT ON COLUMN public.integration_providers.http_headers IS 'Array de objetos para las cabeceras HTTP personalizadas. Ej: [{"name": "Content-Type", "value": "application/json"}].';
COMMENT ON COLUMN public.integration_providers.authentication_config IS 'Almacena los valores de configuración para el método de autenticación seleccionado. Ej: {"header_name": "X-API-Key"}.';
COMMENT ON COLUMN public.integration_providers.body_template IS 'Plantilla para cuerpos de solicitud que no son JSON (ej. XML). Usa placeholders como {{valor}}.';
COMMENT ON COLUMN public.integration_providers.response_mapping IS 'Array de objetos para mapear la respuesta a campos de Glamtica. Ej: [{"glamtica_field": "external_id", "response_path": "data.transaction.id"}].';

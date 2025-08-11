
-- Fase 1: Creación de estructuras para formularios dinámicos y consentimientos de clientes

-- Tabla para almacenar las plantillas de los formularios que los tenants pueden diseñar.
CREATE TABLE client_document_templates (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    schema JSONB NOT NULL DEFAULT '{}'::jsonb, -- Estructura del formulario (campos, tipos, etc.)
    is_active BOOLEAN NOT NULL DEFAULT true,
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE client_document_templates IS 'Almacena las plantillas de formularios personalizables por el tenant (ej. Ficha Técnica).';
COMMENT ON COLUMN client_document_templates.schema IS 'Define la estructura del formulario, como los campos, sus tipos y orden.';

-- Tabla para almacenar las respuestas de los clientes a un formulario específico.
CREATE TABLE client_document_instances (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    template_id BIGINT NOT NULL REFERENCES client_document_templates(id) ON DELETE RESTRICT,
    data JSONB NOT NULL DEFAULT '{}'::jsonb, -- Datos rellenados por el cliente
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE client_document_instances IS 'Almacena los datos de un formulario específico rellenado por un cliente.';

-- Tabla para registrar consentimientos específicos (firma, uso de imagen, etc.).
CREATE TABLE client_consent_records (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    consent_type TEXT NOT NULL, -- Ej. 'general_signature', 'image_use'
    signature_data TEXT, -- Para firmas en Base64 u otro formato
    metadata JSONB, -- Para info adicional como IP, User Agent, etc.
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE client_consent_records IS 'Registra los consentimientos otorgados por los clientes.';

-- Tabla de configuración del tenant para funcionalidades de clientes.
CREATE TABLE tenant_client_settings (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    tenant_id UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
    default_intake_form_id BIGINT REFERENCES client_document_templates(id) ON DELETE SET NULL,
    require_general_signature BOOLEAN NOT NULL DEFAULT false,
    require_image_consent BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE tenant_client_settings IS 'Configuraciones a nivel de tenant para la gestión de clientes.';
COMMENT ON COLUMN tenant_client_settings.default_intake_form_id IS 'Define qué plantilla de formulario se usará por defecto para nuevos clientes.';

-- Triggers para actualizar el campo updated_at automáticamente
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_updated_at_client_document_templates
BEFORE UPDATE ON client_document_templates
FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

CREATE TRIGGER trigger_set_updated_at_tenant_client_settings
BEFORE UPDATE ON tenant_client_settings
FOR EACH ROW EXECUTE PROCEDURE set_updated_at();


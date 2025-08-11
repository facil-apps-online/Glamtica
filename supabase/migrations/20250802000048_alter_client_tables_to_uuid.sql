-- Migración para recrear las tablas de clientes con UUID como claves primarias y foráneas

-- Eliminar tablas existentes si existen, en orden de dependencia inversa
DROP TABLE IF EXISTS tenant_client_settings CASCADE;
DROP TABLE IF EXISTS client_document_instances CASCADE;
DROP TABLE IF EXISTS client_consent_records CASCADE;
DROP TABLE IF EXISTS client_document_templates CASCADE;

-- Recrear la tabla client_document_templates con UUID PK
CREATE TABLE client_document_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    schema JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE client_document_templates IS 'Almacena las plantillas de formularios personalizables por el tenant (ej. Ficha Técnica).';
COMMENT ON COLUMN client_document_templates.schema IS 'Define la estructura del formulario, como los campos, sus tipos y orden.';

-- Recrear la tabla client_document_instances con UUID PK y FK
CREATE TABLE client_document_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES client_document_templates(id) ON DELETE RESTRICT,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE client_document_instances IS 'Almacena los datos de un formulario específico rellenado por un cliente.';

-- Recrear la tabla client_consent_records con UUID PK y FK
CREATE TABLE client_consent_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    consent_type TEXT NOT NULL,
    signature_data TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE client_consent_records IS 'Registra los consentimientos otorgados por los clientes.';

-- Recrear la tabla tenant_client_settings con UUID PK y FK
CREATE TABLE tenant_client_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
    default_intake_form_id UUID REFERENCES client_document_templates(id) ON DELETE SET NULL,
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

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_set_updated_at_client_document_templates') THEN
        CREATE TRIGGER trigger_set_updated_at_client_document_templates
        BEFORE UPDATE ON client_document_templates
        FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_set_updated_at_tenant_client_settings') THEN
        CREATE TRIGGER trigger_set_updated_at_tenant_client_settings
        BEFORE UPDATE ON tenant_client_settings
        FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
    END IF;
END $$;
-- Fase 1: Estructura de la Base de Datos para Emails Transaccionales (Corregida v2)

-- Tabla para almacenar las plantillas de correo maestras, gestionadas por el superadmin (tenant_id = 0)
CREATE TABLE public.email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    template_type TEXT NOT NULL,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    body_html TEXT NOT NULL,
    language_id UUID NOT NULL REFERENCES public.languages(id) ON DELETE RESTRICT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT email_templates_tenant_id_check CHECK (tenant_id = '00000000-0000-0000-0000-000000000000'),
    CONSTRAINT unique_template_lang_per_tenant UNIQUE (tenant_id, template_type, language_id)
);

COMMENT ON TABLE public.email_templates IS 'Plantillas de correo maestras definidas por el Superadmin para eventos del sistema.';
COMMENT ON COLUMN public.email_templates.template_type IS 'Identificador programático del evento que dispara el correo (e.g., WELCOME_USER, PASSWORD_RESET).';
COMMENT ON COLUMN public.email_templates.tenant_id IS 'Debe ser siempre el UUID del superadmin (tenant 0).';
COMMENT ON COLUMN public.email_templates.language_id IS 'FK a la tabla languages, usando el ID del idioma.';


-- Tabla para que cada tenant configure si desea enviar o no un tipo de correo
CREATE TABLE public.tenant_template_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    template_type TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_template_per_tenant UNIQUE (tenant_id, template_type)
);

COMMENT ON TABLE public.tenant_template_settings IS 'Configuración por tenant para activar o desactivar el envío de plantillas de correo específicas.';
COMMENT ON COLUMN public.tenant_template_settings.template_type IS 'Identificador de la plantilla que se está configurando (e.g., APPOINTMENT_REMINDER).';
COMMENT ON COLUMN public.tenant_template_settings.is_active IS 'Interruptor para que el tenant decida si este tipo de correo se envía o no.';


-- Tabla para registrar todos los correos enviados por el sistema
CREATE TABLE public.email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    recipient_email TEXT NOT NULL,
    template_id UUID REFERENCES public.email_templates(id) ON DELETE SET NULL,
    status TEXT NOT NULL,
    error_message TEXT,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.email_logs IS 'Registro de auditoría para todos los correos transaccionales enviados.';
COMMENT ON COLUMN public.email_logs.status IS 'Estado del envío: SENT, FAILED.';


-- Habilitar Row Level Security (RLS) para las nuevas tablas
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_template_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

BEGIN;

-- ### Tabla: email_templates ###

-- 1. Eliminar la restricción obsoleta que forzaba el tenant_id a ser el UUID cero.
ALTER TABLE public.email_templates
DROP CONSTRAINT IF EXISTS email_templates_tenant_id_check;

-- 2. Añadir la columna platform_id para vincular plantillas maestras a una plataforma.
ALTER TABLE public.email_templates
ADD COLUMN platform_id UUID REFERENCES public.platforms(id) ON DELETE CASCADE;

COMMENT ON COLUMN public.email_templates.platform_id IS 'Identifica la plataforma para las plantillas maestras. Es NULL para las plantillas personalizadas por tenants.';

-- 3. Añadir columnas de control de reglas de negocio.
ALTER TABLE public.email_templates
ADD COLUMN is_customizable BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN is_disableable BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN public.email_templates.is_customizable IS 'Si es true, los tenants pueden crear sus propias versiones de esta plantilla.';
COMMENT ON COLUMN public.email_templates.is_disableable IS 'Si es true, los tenants pueden desactivar este tipo de notificación por correo.';

-- 4. Backfill: Asignar la plataforma correcta a las plantillas maestras existentes.
-- Asumimos que las plantillas maestras existentes pertenecen a la plataforma principal "Glamtica".
-- Y que su tenant_id es el del "System Owner" de esa plataforma.
UPDATE public.email_templates et
SET platform_id = p.id
FROM public.platforms p
WHERE p.name = 'Glamtica' AND et.tenant_id = (
    SELECT t.id
    FROM public.tenants t
    WHERE t.is_system_owner = true AND t.platform_id = p.id
    LIMIT 1
);

-- ### Tabla: tenant_template_settings ###

-- 1. Añadir la columna para que el tenant elija su plantilla personalizada.
-- Se permite NULL para que el tenant pueda usar la plantilla por defecto de la plataforma.
-- Si una plantilla personalizada se elimina, el valor se vuelve NULL, revirtiendo a la de por defecto.
ALTER TABLE public.tenant_template_settings
ADD COLUMN template_id UUID REFERENCES public.email_templates(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.tenant_template_settings.template_id IS 'La plantilla específica que un tenant elige usar. Si es NULL, utiliza la plantilla por defecto de la plataforma.';


COMMIT;
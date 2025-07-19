-- Añadir la columna para la propagación automática de configuraciones a nuevos tenants
ALTER TABLE public.email_templates
ADD COLUMN propagate_to_new_tenants BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.email_templates.propagate_to_new_tenants IS 'Si es true, se creará una configuración para los nuevos tenants, permitiéndoles activar/desactivar este tipo de plantilla.';

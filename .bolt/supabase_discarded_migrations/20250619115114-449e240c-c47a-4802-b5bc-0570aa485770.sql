
-- Crear tabla de configuración del sistema
CREATE TABLE public.settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla de idiomas
CREATE TABLE public.languages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE, -- 'es', 'en', 'fr', etc.
  name TEXT NOT NULL, -- 'Español', 'English', 'Français'
  native_name TEXT NOT NULL, -- 'Español', 'English', 'Français'
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla de traducciones
CREATE TABLE public.translations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  language_id UUID REFERENCES public.languages(id) NOT NULL,
  key TEXT NOT NULL, -- 'clients.name', 'appointments.date', etc.
  value TEXT NOT NULL,
  context TEXT, -- Para agrupar traducciones por módulo
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(language_id, key)
);

-- Insertar configuraciones básicas
INSERT INTO public.settings (key, value, description) VALUES
('currency', 'EUR', 'Moneda principal del sistema'),
('currency_symbol', '€', 'Símbolo de la moneda'),
('date_format', 'DD/MM/YYYY', 'Formato de fecha'),
('time_format', '24h', 'Formato de hora (12h o 24h)'),
('business_name', 'Salón de Belleza P&B', 'Nombre del negocio'),
('default_language', 'es', 'Idioma por defecto del sistema');

-- Insertar idiomas
INSERT INTO public.languages (code, name, native_name, is_active, is_default) VALUES
('es', 'Español', 'Español', true, true),
('en', 'English', 'English', true, false),
('fr', 'Français', 'Français', false, false);

-- Insertar traducciones básicas para español
INSERT INTO public.translations (language_id, key, value, context) VALUES
((SELECT id FROM public.languages WHERE code = 'es'), 'clients.title', 'Clientes', 'navigation'),
((SELECT id FROM public.languages WHERE code = 'es'), 'clients.name', 'Nombre', 'form'),
((SELECT id FROM public.languages WHERE code = 'es'), 'clients.phone', 'Teléfono', 'form'),
((SELECT id FROM public.languages WHERE code = 'es'), 'clients.email', 'Email', 'form'),
((SELECT id FROM public.languages WHERE code = 'es'), 'clients.add', 'Agregar Cliente', 'button'),
((SELECT id FROM public.languages WHERE code = 'es'), 'clients.edit', 'Editar Cliente', 'button'),
((SELECT id FROM public.languages WHERE code = 'es'), 'clients.delete', 'Eliminar Cliente', 'button'),
((SELECT id FROM public.languages WHERE code = 'es'), 'common.save', 'Guardar', 'button'),
((SELECT id FROM public.languages WHERE code = 'es'), 'common.cancel', 'Cancelar', 'button'),
((SELECT id FROM public.languages WHERE code = 'es'), 'common.edit', 'Editar', 'button'),
((SELECT id FROM public.languages WHERE code = 'es'), 'common.delete', 'Eliminar', 'button');

-- Insertar traducciones para inglés
INSERT INTO public.translations (language_id, key, value, context) VALUES
((SELECT id FROM public.languages WHERE code = 'en'), 'clients.title', 'Clients', 'navigation'),
((SELECT id FROM public.languages WHERE code = 'en'), 'clients.name', 'Name', 'form'),
((SELECT id FROM public.languages WHERE code = 'en'), 'clients.phone', 'Phone', 'form'),
((SELECT id FROM public.languages WHERE code = 'en'), 'clients.email', 'Email', 'form'),
((SELECT id FROM public.languages WHERE code = 'en'), 'clients.add', 'Add Client', 'button'),
((SELECT id FROM public.languages WHERE code = 'en'), 'clients.edit', 'Edit Client', 'button'),
((SELECT id FROM public.languages WHERE code = 'en'), 'clients.delete', 'Delete Client', 'button'),
((SELECT id FROM public.languages WHERE code = 'en'), 'common.save', 'Save', 'button'),
((SELECT id FROM public.languages WHERE code = 'en'), 'common.cancel', 'Cancel', 'button'),
((SELECT id FROM public.languages WHERE code = 'en'), 'common.edit', 'Edit', 'button'),
((SELECT id FROM public.languages WHERE code = 'en'), 'common.delete', 'Delete', 'button');

-- Habilitar RLS para las nuevas tablas
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;

-- Políticas RLS permisivas para desarrollo
CREATE POLICY "Enable all operations for settings" ON public.settings FOR ALL USING (true);
CREATE POLICY "Enable all operations for languages" ON public.languages FOR ALL USING (true);
CREATE POLICY "Enable all operations for translations" ON public.translations FOR ALL USING (true);

-- Crear índices para mejorar el rendimiento
CREATE INDEX idx_translations_language_key ON public.translations(language_id, key);
CREATE INDEX idx_translations_context ON public.translations(context);
CREATE INDEX idx_settings_key ON public.settings(key);
CREATE INDEX idx_languages_code ON public.languages(code);

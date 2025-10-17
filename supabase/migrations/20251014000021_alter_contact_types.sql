-- Renombrar la tabla
ALTER TABLE public.supplier_contact_types RENAME TO contact_types;

-- Añadir las nuevas columnas
ALTER TABLE public.contact_types
ADD COLUMN is_for_supplier boolean NOT NULL DEFAULT false,
ADD COLUMN is_for_client boolean NOT NULL DEFAULT false;

-- Actualizar los datos existentes
UPDATE public.contact_types SET is_for_supplier = true;

-- Renombrar la clave primaria
ALTER TABLE public.contact_types RENAME CONSTRAINT supplier_contact_types_pkey TO contact_types_pkey;

-- Renombrar el foreign key
ALTER TABLE public.contact_types RENAME CONSTRAINT supplier_contact_types_tenant_id_fkey TO contact_types_tenant_id_fkey;

-- Eliminar la política de seguridad anterior
DROP POLICY "Allow all for authenticated users" ON public.contact_types;

-- Crear una nueva política de seguridad con el nuevo nombre de tabla
CREATE POLICY "Allow all for authenticated users" ON public.contact_types FOR ALL
TO authenticated
USING (tenant_id = (SELECT current_setting('''app.tenant_id''', TRUE)::uuid))
WITH CHECK (tenant_id = (SELECT current_setting('''app.tenant_id''', TRUE)::uuid));

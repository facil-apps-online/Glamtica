-- Migration: 20250802000043_update_tenant_settings_for_invoicing.sql
-- Description: Actualiza la tabla `tenant_settings` para incluir los campos de facturación de productos y servicios.

DO $$
BEGIN
    -- Añadir invoice_products_enabled y invoice_services_enabled a settings_data con valor por defecto false
    UPDATE public.tenant_settings
    SET settings_data = jsonb_set(
        jsonb_set(
            settings_data,
            '{invoice_products_enabled}',
            'false'::jsonb,
            true
        ),
        '{invoice_services_enabled}',
        'false'::jsonb,
        true
    )
    WHERE settings_data ->> 'invoice_products_enabled' IS NULL
       OR settings_data ->> 'invoice_services_enabled' IS NULL;

    -- Si no hay registros, insertar uno con los valores por defecto
    INSERT INTO public.tenant_settings (tenant_id, settings_data)
    SELECT t.id, 
           jsonb_build_object(
               'invoice_products_enabled', false,
               'invoice_services_enabled', false
           )
    FROM public.tenants t
    WHERE NOT EXISTS (SELECT 1 FROM public.tenant_settings ts WHERE ts.tenant_id = t.id);

END
$$;

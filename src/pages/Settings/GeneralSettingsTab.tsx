import React, { useState, useMemo, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useUpdateTenant } from '@/hooks/useTenants';
import { useTenantSettingsData, TenantSettingsData } from '@/hooks/useTenantSettingsData';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { AddressAutocompleteInput } from '@/components/AddressAutocompleteInput';
import { MapDisplay } from '@/components/MapDisplay';
import { PhoneInput } from '@/components/PhoneInput';
import { Save, Building } from 'lucide-react';
import { TenantAdminGeneralView } from './TenantAdminGeneralView';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePublicRegistrationData } from '@/hooks/usePublicRegistrationData';
import { z } from 'zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { FilterableSelect } from '@/components/FilterableSelect';

const formSchema = z.object({
  name: z.string().min(2, "El nombre comercial es requerido."),
  country_id: z.string().min(1, "El país es requerido."),
  default_language_code: z.string().min(1, "El idioma es requerido."),
  default_currency_id: z.string().min(1, "La moneda es requerida."),
  default_timezone: z.string().min(1, "La zona horaria es requerida."),
  contact_phone: z.string().optional().nullable(),
  whatsapp_phone: z.string().optional().nullable(),
  commercial_email: z.string().email("Debe ser un email válido.").optional().nullable().or(z.literal('')),
  legal_name: z.string().optional().nullable(),
  tax_id: z.string().optional().nullable(),
  billing_address: z.string().optional().nullable(),
  einvoicing_email: z.string().email("Debe ser un email válido.").optional().nullable().or(z.literal('')),
  physical_address_line1: z.string().optional().nullable(),
  physical_address_line2: z.string().optional().nullable(),
  physical_city: z.string().optional().nullable(),
  physical_state: z.string().optional().nullable(),
  physical_postal_code: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  latitude: z.number().min(-90).max(90).nullable(),
  longitude: z.number().min(-180).max(180).nullable(),
});

const SettingsFormSkeleton = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-7 w-1/3" />
      <Skeleton className="h-4 w-2/3 mt-1" />
    </CardHeader>
    <CardContent className="space-y-8">
      {[...Array(5)].map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-4 w-1/2 mt-1" />
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-9 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-9 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </CardContent>
  </Card>
);

import { TenantSettingsData } from '@/hooks/useTenantSettingsData';

const SuperAdminGeneralSettingsView = ({ tenantId, settingsData, isLoading: isLoadingTenant }: { tenantId: string, settingsData: TenantSettingsData | undefined, isLoading: boolean }) => {
  const { toast } = useToast();
  const updateTenantMutation = useUpdateTenant();

  const { tenant, countries, languages, currencies } = settingsData || {};

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {},
  });

  const watchedCountryId = form.watch('country_id');
  const watchedLat = form.watch('latitude');
  const watchedLng = form.watch('longitude');

  const countryRestriction = useMemo(() => {
    if (!watchedCountryId || !countries) return null;
    const selectedCountry = countries.find(c => c.id === watchedCountryId);
    return selectedCountry?.iso_code || null;
  }, [watchedCountryId, countries]);

  const activeCountryOptions = useMemo(() => countries?.map(c => ({ value: c.id, label: c.name })) || [], [countries]);
  const activeLocalizationOptions = useMemo(() => {
    if (!languages || !watchedCountryId || !countries) return [];
    const selectedCountry = countries.find(c => c.id === watchedCountryId);
    if (!selectedCountry) return [];
    const countryIsoCode = selectedCountry.iso_code;
    return languages
        .filter(l => l.iso_code.endsWith(`-${countryIsoCode}`))
        .map(l => ({ value: l.iso_code, label: l.name }));
  }, [languages, watchedCountryId, countries]);

  const activeCurrencyOptions = useMemo(() => {
    if (!currencies) return [];
    return currencies.map(c => ({ value: c.id, label: `${c.name} (${c.symbol})` }));
  }, [currencies]);
  const timezoneOptions = useMemo(() => {
    if (!watchedCountryId || !countries) return [];
    const selectedCountry = countries.find(c => c.id === watchedCountryId);
    return selectedCountry?.timezones?.map(tz => ({ value: tz, label: tz })) || [];
  }, [watchedCountryId, countries]);

  useEffect(() => {
    if (tenant && countries && languages) {
      const valuesToSet: Partial<z.infer<typeof formSchema>> = {
        name: tenant.name,
        country_id: tenant.country_id,
        default_language_code: tenant.default_language_code,
        default_currency_id: tenant.default_currency_id,
        default_timezone: tenant.default_timezone,
        contact_phone: tenant.contact_phone,
        whatsapp_phone: tenant.whatsapp_phone,
        commercial_email: tenant.commercial_email,
        legal_name: tenant.legal_name,
        tax_id: tenant.tax_id,
        billing_address: tenant.billing_address,
        einvoicing_email: tenant.einvoicing_email,
        physical_address_line1: tenant.physical_address_line1,
        physical_address_line2: tenant.physical_address_line2,
        physical_city: tenant.physical_city,
        physical_state: tenant.physical_state,
        physical_postal_code: tenant.physical_postal_code,
        website: tenant.website,
        latitude: tenant.latitude || null,
        longitude: tenant.longitude || null,
      };

      const countryId = tenant.country_id;
      if (countryId) {
        const country = countries.find(c => c.id === countryId);
        if (country) {
            if (!valuesToSet.default_language_code) {
                const localization = languages.find(l => l.id === country.default_localization_id);
                if (localization) {
                  valuesToSet.default_language_code = localization.iso_code;
                }
            }
            if (!valuesToSet.default_currency_id) {
                if (country.default_currency_id) {
                  valuesToSet.default_currency_id = country.default_currency_id;
                }
            }
            if (!valuesToSet.default_timezone) {
                if (country.timezones && country.timezones.length > 0) {
                  valuesToSet.default_timezone = country.timezones[0];
                }
            }
        }
      }
      form.reset(valuesToSet);
    }
  }, [tenant, countries, languages, form]);

  const handlePlaceSelected = (place: google.maps.places.PlaceResult) => {
    const get = (type: string) => place.address_components?.find(c => c.types.includes(type))?.long_name || '';
    form.setValue('physical_address_line1', `${get('route')} ${get('street_number')}`.trim());
    form.setValue('physical_city', get('locality'));
    form.setValue('physical_state', get('administrative_area_level_1'));
    form.setValue('physical_postal_code', get('postal_code'));
    if (place.geometry?.location) {
      form.setValue('latitude', place.geometry.location.lat());
      form.setValue('longitude', place.geometry.location.lng());
    }
    const countryIso = place.address_components?.find(c => c.types.includes('country'))?.short_name;
    if (countryIso && countries) {
      const selectedCountry = countries.find(c => c.iso_code === countryIso);
      if (selectedCountry) form.setValue('country_id', selectedCountry.id, { shouldDirty: true });
    }
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    updateTenantMutation.mutate({ id: tenantId, ...values }, {
      onSuccess: () => toast({ title: 'Información Actualizada', description: 'La información de tu negocio ha sido actualizada.', variant: 'success' }),
      onError: (error) => toast({ title: 'Error', description: `Error al actualizar: ${error.message}`, variant: 'destructive' }),
    });
  };

  if (isLoadingTenant || !settingsData) return <SettingsFormSkeleton />;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Building className="h-5 w-5" />
          Configuración General
        </CardTitle>
        <CardDescription>Administra la información principal y regional de tu negocio.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8" autoComplete="off">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Información Principal</CardTitle>
                <CardDescription>Nombre comercial que verán tus clientes.</CardDescription>
              </CardHeader>
              <CardContent>
                <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nombre Comercial</FormLabel><FormControl><Input autoComplete="off" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Configuración Regional</CardTitle>
                <CardDescription>Define el país, idioma y moneda por defecto para tu negocio.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Controller
                    name="country_id"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>País</FormLabel>
                        <FilterableSelect
                          options={activeCountryOptions}
                          value={field.value}
                          onValueChange={(value) => {
                            field.onChange(value);
                            if (value && countries && languages) {
                              const country = countries.find(c => c.id === value);
                              if (country) {
                                const localization = languages.find(l => l.id === country.default_localization_id);
                                if (localization) form.setValue('default_language_code', localization.iso_code, { shouldDirty: true });
                                if (country.default_currency_id) form.setValue('default_currency_id', country.default_currency_id, { shouldDirty: true });
                                if (country.timezones && country.timezones.length > 0) {
                                    form.setValue('default_timezone', country.timezones[0], { shouldDirty: true });
                                }
                              }
                            }
                          }}
                          placeholder="Selecciona un país"
                        />
                      </FormItem>
                    )}
                  />
                  <Controller name="default_language_code" control={form.control} render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Idioma</FormLabel><FilterableSelect options={activeLocalizationOptions} value={field.value} onValueChange={field.onChange} placeholder="Selecciona un idioma" /></FormItem>)} />
                  <Controller name="default_currency_id" control={form.control} render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Moneda</FormLabel><FilterableSelect options={activeCurrencyOptions} value={field.value} onValueChange={field.onChange} placeholder="Selecciona una moneda" /></FormItem>)} />
                  <Controller name="default_timezone" control={form.control} render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Zona Horaria</FormLabel><FilterableSelect options={timezoneOptions} value={field.value} onValueChange={field.onChange} placeholder="Selecciona una zona" /></FormItem>)} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Información de Contacto</CardTitle>
                <CardDescription>Datos de contacto públicos y para notificaciones.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <FormField control={form.control} name="contact_phone" render={({ field }) => (<FormItem><FormLabel>Teléfono de Contacto</FormLabel><FormControl><PhoneInput {...field} defaultCountryIsoCode={countryRestriction} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="whatsapp_phone" render={({ field }) => (<FormItem><FormLabel>WhatsApp</FormLabel><FormControl><PhoneInput {...field} defaultCountryIsoCode={countryRestriction} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="commercial_email" render={({ field }) => (<FormItem><FormLabel>Email Comercial</FormLabel><FormControl><Input autoComplete="off" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Información Fiscal</CardTitle>
                <CardDescription>Datos legales para facturación y documentos tributarios.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField control={form.control} name="legal_name" render={({ field }) => (<FormItem><FormLabel>Razón Social / Nombre Legal</FormLabel><FormControl><Input autoComplete="off" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="tax_id" render={({ field }) => (<FormItem><FormLabel>ID Fiscal (NIT, CUIT, etc.)</FormLabel><FormControl><Input autoComplete="off" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <FormField control={form.control} name="billing_address" render={({ field }) => (<FormItem><FormLabel>Dirección de Facturación</FormLabel><FormControl><Input autoComplete="off" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="einvoicing_email" render={({ field }) => (<FormItem><FormLabel>Email para Facturación Electrónica</FormLabel><FormControl><Input autoComplete="off" type="email" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Dirección Física</CardTitle>
                <CardDescription>Ubicación principal de tu negocio para mapas y búsquedas locales.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <FormItem><FormLabel>Buscar Dirección (Autocompletado de Google)</FormLabel><FormControl><AddressAutocompleteInput onPlaceSelected={handlePlaceSelected} defaultValue={tenant?.physical_address_line1 || ''} countryRestriction={countryRestriction} /></FormControl><FormMessage /></FormItem>
                    <FormField control={form.control} name="physical_address_line1" render={({ field }) => (<FormItem><FormLabel>Dirección (Línea 1)</FormLabel><FormControl><Input autoComplete="off" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="physical_address_line2" render={({ field }) => (<FormItem><FormLabel>Dirección (Línea 2)</FormLabel><FormControl><Input autoComplete="off" placeholder="Apto, Oficina, etc. (Opcional)" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <FormField control={form.control} name="physical_city" render={({ field }) => (<FormItem><FormLabel>Ciudad</FormLabel><FormControl><Input autoComplete="off" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="physical_state" render={({ field }) => (<FormItem><FormLabel>Estado / Provincia</FormLabel><FormControl><Input autoComplete="off" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="physical_postal_code" render={({ field }) => (<FormItem><FormLabel>Código Postal</FormLabel><FormControl><Input autoComplete="off" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                    <FormField control={form.control} name="website" render={({ field }) => (<FormItem><FormLabel>Sitio Web</FormLabel><FormControl><Input autoComplete="off" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                  {watchedLat !== null && watchedLng !== null && (<div className="w-full h-[400px] rounded-lg overflow-hidden"><MapDisplay latitude={watchedLat} longitude={watchedLng} /></div>)}
                </div>
              </CardContent>
            </Card>
            <div className="flex justify-end">
              <Button type="submit" disabled={updateTenantMutation.isPending}>
                <Save className="w-4 h-4 mr-2" />
                {updateTenantMutation.isPending ? 'Guardando Cambios...' : 'Guardar Cambios'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export function GeneralSettingsTab() {
  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;
  const userRole = currentAssignment?.role_name;
  const isSuperAdmin = userRole === 'tenant_super_admin';

  const { data: settingsData, isLoading: isLoadingTenant } = useTenantSettingsData(tenantId);

  if (!tenantId) {
    return <div>Cargando...</div>;
  }

  if (isSuperAdmin) {
    return <SuperAdminGeneralSettingsView tenantId={tenantId} settingsData={settingsData} isLoading={isLoadingTenant} />;
  }

  return <TenantAdminGeneralView />;
}
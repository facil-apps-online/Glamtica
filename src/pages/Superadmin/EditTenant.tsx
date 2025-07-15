import React, { useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { useTimezones } from '@/hooks/useTimezones';
import { useLocalizations, useCountries } from '@/hooks/useLocalization';
import { useCurrencies } from '@/hooks/useCurrencies';
import { useTenantById, useUpdateTenant } from '@/hooks/useTenants';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useParams } from 'react-router-dom';
import { AddressAutocompleteInput } from '@/components/AddressAutocompleteInput';
import { MapDisplay } from '@/components/MapDisplay';
import { PhoneInput } from '@/components/PhoneInput';

const formSchema = z.object({
  // Información Principal
  name: z.string().min(2, "El nombre comercial es requerido."),
  subscription_status: z.enum(['trial', 'active', 'inactive', 'cancelled']),
  country_id: z.string().min(1, "El país es requerido."),
  
  // Configuración Regional
  default_language_code: z.string().min(1, "El idioma es requerido."),
  default_currency_id: z.string().min(1, "La moneda es requerida."),
  default_timezone: z.string().min(1, "La zona horaria es requerida."),

  // Información de Contacto
  contact_phone: z.string().optional().nullable(),
  whatsapp_phone: z.string().optional().nullable(),
  commercial_email: z.string().email("Debe ser un email válido.").optional().nullable().or(z.literal('')),
  
  // Información Fiscal
  legal_name: z.string().optional().nullable(),
  tax_id: z.string().optional().nullable(),
  billing_address: z.string().optional().nullable(),
  einvoicing_email: z.string().email("Debe ser un email válido.").optional().nullable().or(z.literal('')),

  // Dirección Física
  physical_address_line1: z.string().optional().nullable(),
  physical_address_line2: z.string().optional().nullable(),
  physical_city: z.string().optional().nullable(),
  physical_state: z.string().optional().nullable(),
  physical_postal_code: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  
  latitude: z.number().min(-90, "Latitud inválida").max(90, "Latitud inválida").nullable().refine(val => val !== null, { message: "La latitud es requerida." }),
  longitude: z.number().min(-180, "Longitud inválida").max(180, "Longitud inválida").nullable().refine(val => val !== null, { message: "La longitud es requerida." }),
});


export default function EditTenant() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const { data: tenant, isLoading: isLoadingTenant, isError, error } = useTenantById(tenantId!);
  const updateTenantMutation = useUpdateTenant();

  const { data: timezones, isLoading: isLoadingTimezones } = useTimezones();
  const { data: localizations, isLoading: isLoadingLocalizations } = useLocalizations();
  const { data: currencies, isLoading: isLoadingCurrencies } = useCurrencies();
  const { data: countries, isLoading: isLoadingCountries } = useCountries();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {},
  });

  const watchedCountryId = form.watch('country_id');
  const watchedLat = form.watch('latitude');
  const watchedLng = form.watch('longitude');

  const countryRestriction = useMemo(() => {
    if (!watchedCountryId || !countries) return '';
    return countries.find(c => c.id === watchedCountryId)?.iso_code || '';
  }, [watchedCountryId, countries]);

  // Obtener ubicación del dispositivo al cargar la página si no hay coordenadas existentes
  useEffect(() => {
    if (navigator.geolocation && !tenant?.latitude && !tenant?.longitude) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          form.setValue('latitude', position.coords.latitude);
          form.setValue('longitude', position.coords.longitude);
        },
        (error) => {
          console.error("Error al obtener la ubicación del dispositivo:", error);
          toast({ title: 'Error', description: 'No se pudo obtener la ubicación actual del dispositivo.', variant: 'destructive' });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  }, [tenant, form]);

  useEffect(() => {
    if (tenant) {
      form.reset({
        ...tenant,
        name: tenant.name || '',
        subscription_status: tenant.subscription_status || 'trial',
        country_id: tenant.country_id || '',
        default_language_code: tenant.default_language_code || '',
        default_currency_id: tenant.default_currency_id || '',
        default_timezone: tenant.default_timezone || '',
        contact_phone: tenant.contact_phone || '',
        whatsapp_phone: tenant.whatsapp_phone || '',
        commercial_email: tenant.commercial_email || '',
        legal_name: tenant.legal_name || '',
        tax_id: tenant.tax_id || '',
        billing_address: tenant.billing_address || '',
        einvoicing_email: tenant.einvoicing_email || '',
        physical_address_line1: tenant.physical_address_line1 || '',
        physical_address_line2: tenant.physical_address_line2 || '',
        physical_city: tenant.physical_city || '',
        physical_state: tenant.physical_state || '',
        physical_postal_code: tenant.physical_postal_code || '',
        website: tenant.website || '',
        latitude: tenant.latitude || null, // Asegurar que se inicialice con null si no hay valor
        longitude: tenant.longitude || null, // Asegurar que se inicialice con null si no hay valor
      });
    }
  }, [tenant, form]);

  useEffect(() => {
    // Mantener la lógica de idioma, moneda y zona horaria
    if (watchedCountryId && countries && localizations) {
      const country = countries.find(c => c.id === watchedCountryId);
      if (country) {
        const localization = localizations.find(l => l.id === country.default_localization_id);
        if (localization) {
          form.setValue('default_language_code', localization.iso_code);
        }
        if (country.default_currency_id) {
          form.setValue('default_currency_id', country.default_currency_id);
        }
        if (country.timezone) {
          form.setValue('default_timezone', country.timezone);
        }
      }
    }
  }, [watchedCountryId, countries, localizations, form]);

  const handlePlaceSelected = (place: google.maps.places.PlaceResult) => {
    const get = (type: string) => place.address_components?.find(c => c.types.includes(type))?.long_name || '';
    const street = `${get('route')} ${get('street_number')}`.trim();
    form.setValue('physical_address_line1', street);
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
      if (selectedCountry) form.setValue('country_id', selectedCountry.id);
    }
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    updateTenantMutation.mutate(
      { tenantId: tenantId!, values },
      {
        onSuccess: () => {
          toast({
            title: 'Tenant Actualizado',
            description: 'El tenant ha sido actualizado exitosamente.',
          });
          navigate('/superadmin/tenants');
        },
        onError: (error) => {
          toast({
            title: 'Error',
            description: `Error al actualizar el tenant: ${error.message}`,
            variant: 'destructive',
          });
        },
      }
    );
  };

  if (isLoadingTenant || isLoadingCountries || isLoadingCurrencies || isLoadingLocalizations || isLoadingTimezones) {
    return <div>Cargando...</div>;
  }
  if (isError) return <div className="w-full">Error al cargar los datos: {error.message}</div>;

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold mb-6">Editar Tenant: {tenant?.name}</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8" autoComplete="off">
          
          <div className="p-6 border rounded-lg">
            <h2 className="text-lg font-semibold mb-4">Información Principal</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Nombre Comercial</FormLabel><FormControl><Input autoComplete="off" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
              )} />
              <Controller
                name="subscription_status"
                control={form.control}
                render={({ field }) => (
                  <FormItem><FormLabel>Estado de Suscripción</FormLabel>
                  <SearchableSelect
                    options={[{value: 'trial', label: 'Trial'}, {value: 'active', label: 'Activo'}, {value: 'inactive', label: 'Inactivo'}, {value: 'cancelled', label: 'Cancelado'}]}
                    value={[{value: 'trial', label: 'Trial'}, {value: 'active', label: 'Activo'}, {value: 'inactive', label: 'Inactivo'}, {value: 'cancelled', label: 'Cancelado'}].find(o => o.value === field.value) || null}
                    onChange={(option) => field.onChange(option ? option.value : '')}
                    placeholder="Selecciona un estado"
                  /></FormItem>
                )}
              />
            </div>
          </div>

          <div className="p-6 border rounded-lg">
            <h2 className="text-lg font-semibold mb-4">Configuración Regional</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Controller name="country_id" control={form.control} render={({ field }) => (
                <FormItem className="flex flex-col"><FormLabel>País</FormLabel><SearchableSelect options={countries?.map(c => ({ value: c.id, label: c.name })) || []} value={countries?.map(c => ({ value: c.id, label: c.name })).find(c => c.value === field.value) || null} onChange={(option) => field.onChange(option ? option.value : '')} placeholder="Selecciona un país" /></FormItem>
              )} />
              <Controller name="default_language_code" control={form.control} render={({ field }) => (
                <FormItem className="flex flex-col"><FormLabel>Idioma</FormLabel><SearchableSelect options={localizations?.map(l => ({ value: l.iso_code, label: l.name })) || []} value={localizations?.map(l => ({ value: l.iso_code, label: l.name })).find(l => l.value === field.value) || null} onChange={(option) => field.onChange(option ? option.value : '')} placeholder="Selecciona un idioma" /></FormItem>
              )} />
              <Controller name="default_currency_id" control={form.control} render={({ field }) => (
                <FormItem className="flex flex-col"><FormLabel>Moneda</FormLabel><SearchableSelect options={currencies?.map(c => ({ value: c.id, label: `${c.name} (${c.symbol})` })) || []} value={currencies?.map(c => ({ value: c.id, label: `${c.name} (${c.symbol})` })).find(c => c.value === field.value) || null} onChange={(option) => field.onChange(option ? option.value : '')} placeholder="Selecciona una moneda" /></FormItem>
              )} />
              <Controller name="default_timezone" control={form.control} render={({ field }) => (
                <FormItem className="flex flex-col"><FormLabel>Zona Horaria</FormLabel><SearchableSelect options={timezones?.map(t => ({ value: t.name, label: t.name })) || []} value={timezones?.map(t => ({ value: t.name, label: t.name })).find(t => t.value === field.value) || null} onChange={(option) => field.onChange(option ? option.value : '')} placeholder="Selecciona una zona" /></FormItem>
              )} />
            </div>
          </div>

          <div className="p-6 border rounded-lg">
            <h2 className="text-lg font-semibold mb-4">Información de Contacto</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FormField control={form.control} name="contact_phone" render={({ field }) => (
                <FormItem><FormLabel>Teléfono de Contacto</FormLabel><FormControl><PhoneInput {...field} defaultCountryId={countryRestriction} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="whatsapp_phone" render={({ field }) => (
                <FormItem><FormLabel>WhatsApp</FormLabel><FormControl><PhoneInput {...field} defaultCountryId={countryRestriction} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="commercial_email" render={({ field }) => (
                <FormItem><FormLabel>Email Comercial</FormLabel><FormControl><Input autoComplete="off" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
          </div>

          <div className="p-6 border rounded-lg">
            <h2 className="text-lg font-semibold mb-4">Información Fiscal</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField control={form.control} name="legal_name" render={({ field }) => (
                <FormItem><FormLabel>Razón Social / Nombre Legal</FormLabel><FormControl><Input autoComplete="off" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="tax_id" render={({ field }) => (
                <FormItem><FormLabel>ID Fiscal (NIT, CUIT, etc.)</FormLabel><FormControl><Input autoComplete="off" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <FormField control={form.control} name="billing_address" render={({ field }) => (
                <FormItem><FormLabel>Dirección de Facturación</FormLabel><FormControl><Input autoComplete="off" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="einvoicing_email" render={({ field }) => (
                <FormItem><FormLabel>Email para Facturación Electrónica</FormLabel><FormControl><Input autoComplete="off" type="email" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
          </div>

          <div className="p-6 border rounded-lg">
            <h2 className="text-lg font-semibold mb-4">Dirección Física</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <FormItem>
                  <FormLabel>Buscar Dirección (Autocompletado de Google)</FormLabel>
                  <FormControl>
                    <AddressAutocompleteInput 
                      onPlaceSelected={handlePlaceSelected}
                      defaultValue={tenant?.physical_address_line1 || ''}
                      countryRestriction={countryRestriction}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
                <FormField control={form.control} name="physical_address_line1" render={({ field }) => (
                  <FormItem><FormLabel>Dirección (Línea 1)</FormLabel><FormControl><Input autoComplete="off" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="physical_address_line2" render={({ field }) => (
                  <FormItem><FormLabel>Dirección (Línea 2)</FormLabel><FormControl><Input autoComplete="off" placeholder="Apto, Oficina, etc. (Opcional)" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField control={form.control} name="physical_city" render={({ field }) => (
                    <FormItem><FormLabel>Ciudad</FormLabel><FormControl><Input autoComplete="off" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="physical_state" render={({ field }) => (
                    <FormItem><FormLabel>Estado / Provincia</FormLabel><FormControl><Input autoComplete="off" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="physical_postal_code" render={({ field }) => (
                    <FormItem><FormLabel>Código Postal</FormLabel><FormControl><Input autoComplete="off" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                 <FormField control={form.control} name="website" render={({ field }) => (
                    <FormItem><FormLabel>Sitio Web</FormLabel><FormControl><Input autoComplete="off" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                  )} />
              </div>
              {watchedLat !== null && watchedLng !== null && (
                <div className="w-full h-[400px] rounded-lg overflow-hidden">
                  <MapDisplay latitude={watchedLat} longitude={watchedLng} />
                </div>
              )}
            </div>
          </div>

          <Button type="submit" disabled={updateTenantMutation.isPending}>
            {updateTenantMutation.isPending ? 'Guardando Cambios...' : 'Guardar Cambios'}
          </Button>
        </form>
      </Form>
    </div>
  );
}

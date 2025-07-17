import React, { useEffect, useMemo, useState } from 'react';
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
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { AddressAutocompleteInput } from '@/components/AddressAutocompleteInput';
import { MapDisplay } from '@/components/MapDisplay';
import { PhoneInput } from '@/components/PhoneInput';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const formSchema = z.object({
  // Tenant fields
  name: z.string().min(2, "El nombre comercial es requerido."),
  subscription_status: z.enum(['trial', 'active', 'inactive', 'cancelled']),
  country_id: z.string().min(1, "El país es requerido."),
  default_language_code: z.string().min(1, "El idioma es requerido."),
  default_currency_id: z.string().min(1, "La moneda es requerida."),
  default_timezone: z.string().min(1, "La zona horaria es requerida."),
  contact_phone: z.string().optional(),
  whatsapp_phone: z.string().optional(),
  commercial_email: z.string().email("Debe ser un email válido.").optional().or(z.literal('')),
  legal_name: z.string().optional(),
  tax_id: z.string().optional(),
  billing_address: z.string().optional(),
  einvoicing_email: z.string().email("Debe ser un email válido.").optional().or(z.literal('')),
  physical_address_line1: z.string().optional(),
  physical_address_line2: z.string().optional(),
  physical_city: z.string().optional(),
  physical_state: z.string().optional(),
  physical_postal_code: z.string().optional(),
  website: z.string().optional(),
  latitude: z.number().min(-90, "Latitud inválida").max(90, "Latitud inválida").nullable().refine(val => val !== null, { message: "La latitud es requerida." }),
  longitude: z.number().min(-180, "Longitud inválida").max(180, "Longitud inválida").nullable().refine(val => val !== null, { message: "La longitud es requerida." }),

  // Admin user fields
  admin_email: z.string().email("El email del administrador es requerido."),
  admin_password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
  admin_confirm_password: z.string(),
}).refine(data => data.admin_password === data.admin_confirm_password, {
  message: "Las contraseñas no coinciden",
  path: ["admin_confirm_password"],
});

type Credentials = {
  email: string;
  pass: string;
}

export default function CreateTenant() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  const { data: timezones, isLoading: isLoadingTimezones } = useTimezones();
  const { data: localizations, isLoading: isLoadingLocalizations } = useLocalizations();
  const { data: currencies, isLoading: isLoadingCurrencies } = useCurrencies();
  const { data: countries, isLoading: isLoadingCountries } = useCountries();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      subscription_status: 'trial',
      country_id: '',
      default_language_code: '',
      default_currency_id: '',
      default_timezone: '',
      contact_phone: '',
      whatsapp_phone: '',
      commercial_email: '',
      legal_name: '',
      tax_id: '',
      billing_address: '',
      einvoicing_email: '',
      physical_address_line1: '',
      physical_address_line2: '',
      physical_city: '',
      physical_state: '',
      physical_postal_code: '',
      website: '',
      latitude: null,
      longitude: null,
      admin_email: '',
      admin_password: '',
      admin_confirm_password: '',
    },
  });

  const watchedCountryId = form.watch('country_id');
  const watchedLat = form.watch('latitude');
  const watchedLng = form.watch('longitude');

  // Opciones filtradas para los desplegables
  const activeCountryOptions = useMemo(() => 
    countries?.filter(c => c.is_active).map(c => ({ value: c.id, label: c.name })) || [],
    [countries]
  );
  
  const activeLocalizationOptions = useMemo(() => 
    localizations?.filter(l => l.is_active).map(l => ({ value: l.iso_code, label: l.name })) || [],
    [localizations]
  );

  const activeCurrencyOptions = useMemo(() => 
    currencies?.filter(c => c.is_active).map(c => ({ value: c.id, label: `${c.name} (${c.symbol})` })) || [],
    [currencies]
  );

  const timezoneOptions = useMemo(() => 
    timezones?.map(t => ({ value: t.name, label: t.name })) || [],
    [timezones]
  );

  // Lógica para la restricción de Google Maps (usa la lista completa de países)
  const countryRestriction = useMemo(() => {
    if (!watchedCountryId || !countries) return '';
    return countries.find(c => c.id === watchedCountryId)?.iso_code || '';
  }, [watchedCountryId, countries]);

  useEffect(() => {
    if (navigator.geolocation) {
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
  }, [toast, form]);

  useEffect(() => {
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

  const createTenantMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const { error } = await supabase.rpc('create_tenant_with_admin', {
        name: values.name,
        subscription_status: values.subscription_status,
        country_id: values.country_id,
        default_language_code: values.default_language_code,
        default_currency_id: values.default_currency_id,
        default_timezone: values.default_timezone,
        contact_phone: values.contact_phone,
        whatsapp_phone: values.whatsapp_phone,
        commercial_email: values.commercial_email,
        legal_name: values.legal_name,
        tax_id: values.tax_id,
        billing_address: values.billing_address,
        einvoicing_email: values.einvoicing_email,
        physical_address_line1: values.physical_address_line1,
        physical_address_line2: values.physical_address_line2,
        physical_city: values.physical_city,
        physical_state: values.physical_state,
        physical_postal_code: values.physical_postal_code,
        website: values.website,
        latitude: values.latitude,
        longitude: values.longitude,
        admin_email: values.admin_email,
        admin_password: values.admin_password,
      });
      if (error) throw new Error(error.message);
      return values;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      toast({ title: '¡Éxito!', description: `Tenant "${data.name}" y administrador creados.` });
      setCredentials({ email: data.admin_email, pass: data.admin_password });
      setIsAlertOpen(true);
    },
    onError: (error) => {
      console.error("Error creating tenant:", error);
      toast({ title: 'Error', description: `Error al crear: ${error.message}`, variant: 'destructive' });
    },
  });

  const handleAlertClose = () => {
    setIsAlertOpen(false);
    navigate('/superadmin/tenants');
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createTenantMutation.mutate(values);
  };

  if (isLoadingCountries || isLoadingCurrencies || isLoadingLocalizations || isLoadingTimezones) {
    return <div>Cargando...</div>;
  }

  return (
    <>
      <div className="w-full">
        <h1 className="text-2xl font-bold mb-6">Crear Nuevo Tenant y Administrador</h1>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8" autoComplete="off">
            
            <div className="p-6 border rounded-lg">
              <h2 className="text-lg font-semibold mb-4">Información Principal</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Nombre Comercial</FormLabel><FormControl><Input autoComplete="off" {...field} /></FormControl><FormMessage /></FormItem>
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
                  <FormItem className="flex flex-col"><FormLabel>País</FormLabel><SearchableSelect options={activeCountryOptions} value={activeCountryOptions.find(c => c.value === field.value) || null} onChange={(option) => field.onChange(option ? option.value : '')} placeholder="Selecciona un país" /></FormItem>
                )} />
                <Controller name="default_language_code" control={form.control} render={({ field }) => (
                  <FormItem className="flex flex-col"><FormLabel>Idioma</FormLabel><SearchableSelect options={activeLocalizationOptions} value={activeLocalizationOptions.find(l => l.value === field.value) || null} onChange={(option) => field.onChange(option ? option.value : '')} placeholder="Selecciona un idioma" /></FormItem>
                )} />
                <Controller name="default_currency_id" control={form.control} render={({ field }) => (
                  <FormItem className="flex flex-col"><FormLabel>Moneda</FormLabel><SearchableSelect options={activeCurrencyOptions} value={activeCurrencyOptions.find(c => c.value === field.value) || null} onChange={(option) => field.onChange(option ? option.value : '')} placeholder="Selecciona una moneda" /></FormItem>
                )} />
                <Controller name="default_timezone" control={form.control} render={({ field }) => (
                  <FormItem className="flex flex-col"><FormLabel>Zona Horaria</FormLabel><SearchableSelect options={timezoneOptions} value={timezoneOptions.find(t => t.value === field.value) || null} onChange={(option) => field.onChange(option ? option.value : '')} placeholder="Selecciona una zona" /></FormItem>
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
                  <FormItem><FormLabel>Email Comercial</FormLabel><FormControl><Input autoComplete="off" type="email" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
              </div>

              <div className="p-6 border rounded-lg">
                <h2 className="text-lg font-semibold mb-4">Información Fiscal</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField control={form.control} name="legal_name" render={({ field }) => (
                    <FormItem><FormLabel>Razón Social / Nombre Legal</FormLabel><FormControl><Input autoComplete="off" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="tax_id" render={({ field }) => (
                    <FormItem><FormLabel>ID Fiscal (NIT, CUIT, etc.)</FormLabel><FormControl><Input autoComplete="off" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <FormField control={form.control} name="billing_address" render={({ field }) => (
                    <FormItem><FormLabel>Dirección de Facturación</FormLabel><FormControl><Input autoComplete="off" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="einvoicing_email" render={({ field }) => (
                    <FormItem><FormLabel>Email para Facturación Electrónica</FormLabel><FormControl><Input autoComplete="off" type="email" {...field} /></FormControl><FormMessage /></FormItem>
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
                          countryRestriction={countryRestriction}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                    <FormField control={form.control} name="physical_address_line1" render={({ field }) => (
                      <FormItem><FormLabel>Dirección (Línea 1)</FormLabel><FormControl><Input autoComplete="off" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="physical_address_line2" render={({ field }) => (
                      <FormItem><FormLabel>Dirección (Línea 2)</FormLabel><FormControl><Input autoComplete="off" placeholder="Apto, Oficina, etc. (Opcional)" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <FormField control={form.control} name="physical_city" render={({ field }) => (
                        <FormItem><FormLabel>Ciudad</FormLabel><FormControl><Input autoComplete="off" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="physical_state" render={({ field }) => (
                        <FormItem><FormLabel>Estado / Provincia</FormLabel><FormControl><Input autoComplete="off" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="physical_postal_code" render={({ field }) => (
                        <FormItem><FormLabel>Código Postal</FormLabel><FormControl><Input autoComplete="off" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>
                     <FormField control={form.control} name="website" render={({ field }) => (
                        <FormItem><FormLabel>Sitio Web</FormLabel><FormControl><Input autoComplete="off" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                  </div>
                  {watchedLat !== null && watchedLng !== null && (
                    <div className="w-full h-[400px] rounded-lg overflow-hidden">
                      <MapDisplay latitude={watchedLat} longitude={watchedLng} />
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 border rounded-lg bg-blue-50">
                <h2 className="text-lg font-semibold mb-4">Administrador Principal del Tenant</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField control={form.control} name="admin_email" render={({ field }) => (
                    <FormItem><FormLabel>Email del Administrador</FormLabel><FormControl><Input autoComplete="off" type="email" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="admin_password" render={({ field }) => (
                    <FormItem><FormLabel>Contraseña</FormLabel><FormControl><Input autoComplete="new-password" type="password" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="admin_confirm_password" render={({ field }) => (
                    <FormItem><FormLabel>Confirmar Contraseña</FormLabel><FormControl><Input autoComplete="new-password" type="password" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
              </div>

              <Button type="submit" disabled={createTenantMutation.isPending}>
                {createTenantMutation.isPending ? 'Creando...' : 'Crear Tenant y Administrador'}
              </Button>
            </form>
          </Form>
        </div>

        <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¡Credenciales del Administrador!</AlertDialogTitle>
              <AlertDialogDescription>
                El tenant y su administrador principal han sido creados. Por favor, guarda estas credenciales en un lugar seguro. 
                No podrás volver a ver la contraseña.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="my-4 space-y-2">
              <p><strong>Email:</strong> {credentials?.email}</p>
              <p><strong>Contraseña:</strong> {credentials?.pass}</p>
            </div>
            <AlertDialogFooter>
              <AlertDialogAction onClick={handleAlertClose}>
                Entendido, he guardado las credenciales
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </>
  );
}
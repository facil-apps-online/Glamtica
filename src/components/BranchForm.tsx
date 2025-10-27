import React, { useMemo, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useCreateBranch, useUpdateBranch, Branch } from '@/hooks/useBranches';
import { AddressAutocompleteInput } from '@/components/AddressAutocompleteInput';
import { MapDisplay } from '@/components/MapDisplay';
import { Save, Store } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SearchableSelect } from './ui/searchable-select';
import { useTenantById } from '@/hooks/useTenants';
import { PhoneInput } from '@/components/PhoneInput';
import { usePublicRegistrationData } from '@/hooks/usePublicRegistrationData';
import { Skeleton } from '@/components/ui/skeleton';

const formSchema = z.object({
  name: z.string().min(1, "El nombre de la sucursal es requerido."),
  timezone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  contact_phone: z.string().optional().nullable(),
  whatsapp_phone: z.string().optional().nullable(),
  commercial_email: z.string().email("Debe ser un email válido.").optional().nullable().or(z.literal('')), 
  website: z.string().optional().nullable(),
  physical_address_line1: z.string().optional().nullable(),
  physical_address_line2: z.string().optional().nullable(),
  physical_city: z.string().optional().nullable(),
  physical_state: z.string().optional().nullable(),
  physical_postal_code: z.string().optional().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
});

type BranchFormValues = z.infer<typeof formSchema>;

interface BranchFormProps {
  branchToEdit?: Branch | null;
  onSuccess: () => void;
  tenantId: string;
}

export function BranchForm({ branchToEdit, onSuccess, tenantId }: BranchFormProps) {
  const { toast } = useToast();
  const createBranchMutation = useCreateBranch(tenantId);
  const updateBranchMutation = useUpdateBranch(tenantId);
  const { data: tenant } = useTenantById(tenantId);
  const { data: publicData } = usePublicRegistrationData();
  const countries = publicData?.countries;

  const countryRestriction = useMemo(() => {
    if (!tenant?.country_id || !countries) return '';
    return countries.find(c => c.id === tenant.country_id)?.iso_code || '';
  }, [tenant, countries]);

  const timezoneOptions = useMemo(() => {
    if (!countryRestriction || !countries) return [];
    const selectedCountry = countries.find(c => c.iso_code === countryRestriction);
    return selectedCountry?.timezones?.map(tz => ({ value: tz, label: tz })) || [];
  }, [countryRestriction, countries]);

  const form = useForm<BranchFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      timezone: '',
      address: '',
      contact_phone: '',
      whatsapp_phone: '',
      commercial_email: '',
      website: '',
      physical_address_line1: '',
      physical_address_line2: '',
      physical_city: '',
      physical_state: '',
      physical_postal_code: '',
      latitude: null,
      longitude: null,
    },
  });

  const watchedLat = form.watch('latitude');
  const watchedLng = form.watch('longitude');

  useEffect(() => {
    if (branchToEdit) {
      form.reset({
        name: branchToEdit.name || '',
        timezone: branchToEdit.timezone || '',
        address: branchToEdit.address || '',
        contact_phone: branchToEdit.contact_phone || '',
        whatsapp_phone: branchToEdit.whatsapp_phone || '',
        commercial_email: branchToEdit.commercial_email || '',
        website: branchToEdit.website || '',
        physical_address_line1: branchToEdit.physical_address_line1 || '',
        physical_address_line2: branchToEdit.physical_address_line2 || '',
        physical_city: branchToEdit.physical_city || '',
        physical_state: branchToEdit.physical_state || '',
        physical_postal_code: branchToEdit.physical_postal_code || '',
        latitude: branchToEdit.latitude || null,
        longitude: branchToEdit.longitude || null,
      });
    } else if (tenant) {
      form.setValue('timezone', tenant.default_timezone);
    }
  }, [branchToEdit, tenant, form]);

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
    form.setValue('address', place.formatted_address || '');
  };

  const onSubmit = async (values: BranchFormValues) => {
    try {
      if (branchToEdit) {
        await updateBranchMutation.mutateAsync({
          p_branch_id: branchToEdit.id,
          p_name: values.name,
          p_timezone: values.timezone,
          p_address: values.address,
          p_contact_phone: values.contact_phone,
          p_whatsapp_phone: values.whatsapp_phone,
          p_commercial_email: values.commercial_email,
          p_website: values.website,
          p_physical_address_line1: values.physical_address_line1,
          p_physical_address_line2: values.physical_address_line2,
          p_physical_city: values.physical_city,
          p_physical_state: values.physical_state,
          p_physical_postal_code: values.physical_postal_code,
          p_latitude: values.latitude,
          p_longitude: values.longitude,
        });
        toast({ title: 'Éxito', description: 'Sucursal actualizada correctamente.', variant: 'success' });
      } else {
        await createBranchMutation.mutateAsync({
          p_name: values.name,
          p_timezone: values.timezone,
          p_address: values.address,
          p_contact_phone: values.contact_phone,
          p_whatsapp_phone: values.whatsapp_phone,
          p_commercial_email: values.commercial_email,
          p_website: values.website,
          p_physical_address_line1: values.physical_address_line1,
          p_physical_address_line2: values.physical_address_line2,
          p_physical_city: values.physical_city,
          p_physical_state: values.physical_state,
          p_physical_postal_code: values.physical_postal_code,
          p_latitude: values.latitude,
          p_longitude: values.longitude,
        });
        toast({ title: 'Éxito', description: 'Sucursal creada correctamente.', variant: 'success' });
      }
      onSuccess();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const isLoading = createBranchMutation.isPending || updateBranchMutation.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Store className="h-5 w-5" />
          Configuración de la Sucursal
        </CardTitle>
        <CardDescription>
          Administra la información principal, de contacto y dirección de esta sucursal.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Información General</CardTitle>
                <CardDescription>Nombre de la sucursal que verán tus clientes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de la Sucursal</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Configuración Regional</CardTitle>
                <CardDescription>Define la zona horaria para esta sucursal.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {countryRestriction && countries ? (
                  <Controller name="timezone" control={form.control} render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Zona Horaria</FormLabel>
                      <SearchableSelect 
                        options={timezoneOptions} 
                        value={timezoneOptions.find(t => t.value === field.value) || null} 
                        onChange={(option) => field.onChange(option ? option.value : '')} 
                        placeholder="Selecciona una zona horaria"
                      />
                      <FormMessage />
                    </FormItem>
                  )} />
                ) : (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Información de Contacto</CardTitle>
                <CardDescription>Datos de contacto públicos y para notificaciones.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="contact_phone" render={({ field }) => (
                    <FormItem>
                            <FormLabel>Teléfono de Contacto</FormLabel>
                            <FormControl><PhoneInput {...field} defaultCountryIsoCode={countryRestriction} /></FormControl>                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="whatsapp_phone" render={({ field }) => (
                    <FormItem>
                      <FormLabel>WhatsApp</FormLabel>
                      <FormControl><PhoneInput {...field} defaultCountryIsoCode={countryRestriction} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="commercial_email" render={({ field }) => (<FormItem><FormLabel>Email Comercial</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="website" render={({ field }) => (<FormItem><FormLabel>Sitio Web</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Dirección Física</CardTitle>
                <CardDescription>Ubicación de tu sucursal para mapas y búsquedas locales.</CardDescription>
              </CardHeader>
              <CardContent>
                <FormField control={form.control} name="address" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dirección (General)</FormLabel>
                    <FormControl><Input {...field} readOnly /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="space-y-2 mt-4">
                  <FormItem>
                    <FormLabel>Buscar Dirección (Autocompletado de Google)</FormLabel>
                    <FormControl>
                      <AddressAutocompleteInput onPlaceSelected={handlePlaceSelected} countryRestriction={countryRestriction} defaultValue={branchToEdit?.physical_address_line1 || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                  <FormField control={form.control} name="physical_address_line1" render={({ field }) => (<FormItem><FormLabel>Línea 1</FormLabel><FormControl><Input {...field} readOnly /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="physical_address_line2" render={({ field }) => (<FormItem><FormLabel>Línea 2 (Opcional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <FormField control={form.control} name="physical_city" render={({ field }) => (<FormItem><FormLabel>Ciudad</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="physical_state" render={({ field }) => (<FormItem><FormLabel>Estado / Provincia</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="physical_postal_code" render={({ field }) => (<FormItem><FormLabel>Código Postal</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                </div>
                {watchedLat !== null && watchedLng !== null && (
                  <div className="w-full h-[200px] rounded-lg overflow-hidden mt-4">
                    <MapDisplay latitude={watchedLat} longitude={watchedLng} />
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading}>
                <Save className="w-4 h-4 mr-2" />
                {isLoading ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { fetchTenantAction } from '@/lib/fetchTenantAction';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, Plus, ChevronDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { ChatterBox } from '@/components/ChatterBox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExpenseProviderContactsManager } from '@/components/expenses/ExpenseProviderContactsManager'; // To be created
import { ExpenseProviderContactDialog } from '@/components/expenses/ExpenseProviderContactDialog'; // To be created
import { ExpenseProviderAddressesManager } from '@/components/expenses/ExpenseProviderAddressesManager'; // To be created
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBranches } from "@/hooks/useBranches"; // Assuming this hook exists and is generic
import { useAuth } from "@/contexts/AuthContext";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useGetDocumentTypes } from '@/hooks/useDocumentTypes'; // Assuming this hook exists and is generic
import { AddressAutocompleteInput } from '@/components/AddressAutocompleteInput';
import { MapDisplay } from '@/components/MapDisplay';
import { PhoneInput } from '@/components/PhoneInput';
import { useCountries } from '@/hooks/useCountries';


interface ExpenseProvider {
    id: string;
    name: string;
    identification_number: string;
    phone: string | null;
    email: string | null;
    is_active: boolean;
    document_type_id: string | null;
    branch_ids: string[] | null;
    address_line_1: string | null;
    address_line_2: string | null;
    city: string | null;
    state: string | null;
    postal_code: string | null;
    country: string | null;
    latitude: number | null;
    longitude: number | null;
    tenant_id: string;
}

const formSchema = z.object({
  name: z.string().min(1, "El nombre es requerido."),
  document_type_id: z.string().uuid("Selecciona un tipo de documento válido.").nullable().optional(),
  identification_number: z.string().min(1, "El número de identificación es requerido."),
  phone: z.string().nullable().optional(),
  email: z.string().email("Ingresa un email válido.").nullable().optional().or(z.literal("")),
  branch_ids: z.array(z.string()).optional(),
  address_line_1: z.string().nullable().optional(),
  address_line_2: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  postal_code: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
});

type ExpenseProviderFormValues = z.infer<typeof formSchema>;

export default function EditExpenseProviderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentAssignment, tenant } = useAuth();
  const tenantId = currentAssignment?.tenant_id;

  const { data: expenseProvider, isLoading: isLoadingExpenseProvider } = useQuery<ExpenseProvider>({
    queryKey: ["expenseProviders", id],
    queryFn: () => fetchTenantAction("get-expense-provider", { id }),
    enabled: !!id,
  });

  const updateProviderMutation = useMutation({
    mutationFn: (updates: Partial<ExpenseProviderFormValues>) =>
      fetchTenantAction("update-expense-provider", { id, ...updates }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenseProviders", id] });
      queryClient.invalidateQueries({ queryKey: ["expenseProviders"] });
      toast({ title: "Éxito", description: "Proveedor de Gasto actualizado correctamente.", variant: "success" });
      form.reset(form.getValues(), { keepValues: true, keepDirty: false, keepDefaultValues: false }); // Reset form to clear dirty state
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const { data: branches } = useBranches(tenantId);
  const { data: documentTypes, isLoading: isLoadingDocumentTypes } = useGetDocumentTypes('supplier');
  const { data: countries } = useCountries();
  const tenantCountryId = tenant?.country_id;
  const countryIsoCode = countries?.find(c => c.id === tenantCountryId)?.iso_code;

  const form = useForm<ExpenseProviderFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        name: '',
        document_type_id: undefined, // Use undefined for Select
        identification_number: '',
        phone: '',
        email: '',
        branch_ids: [],
        address_line_1: '',
        address_line_2: '',
        city: '',
        state: '',
        postal_code: '',
        country: '',
        latitude: null,
        longitude: null,
    },
  });

  const { formState: { isDirty } } = form;
  const [activeTab, setActiveTab] = useState("general");
  const [isAddingAddress, setIsAddingAddress] = useState(false); // For additional addresses

  useEffect(() => {
    if (expenseProvider && documentTypes) {
        form.reset({
            name: expenseProvider.name || '',
            document_number: expenseProvider.identification_number || '', // Assuming this will be mapped from backend
            document_type_id: expenseProvider.document_type_id || undefined,
            identification_number: expenseProvider.identification_number || '',
            phone: expenseProvider.phone || '',
            email: expenseProvider.email || '',
            branch_ids: expenseProvider.branch_ids || [],
            address_line_1: expenseProvider.address_line_1 || '',
            address_line_2: expenseProvider.address_line_2 || '',
            city: expenseProvider.city || '',
            state: expenseProvider.state || '',
            postal_code: expenseProvider.postal_code || '',
            country: expenseProvider.country || '',
            latitude: expenseProvider.latitude || null,
            longitude: expenseProvider.longitude || null,
        });
    }
  }, [expenseProvider, documentTypes, form]);

  const handlePlaceSelected = (place: google.maps.places.PlaceResult) => {
    const get = (type: string) => place.address_components?.find(c => c.types.includes(type))?.long_name || '';
    form.setValue('address_line_1', `${get('route')} ${get('street_number')}`.trim(), { shouldDirty: true });
    form.setValue('city', get('locality'), { shouldDirty: true });
    form.setValue('state', get('administrative_area_level_1'), { shouldDirty: true });
    form.setValue('postal_code', get('postal_code'), { shouldDirty: true });
    form.setValue('country', get('country'), { shouldDirty: true });
    if (place.geometry?.location) {
        form.setValue('latitude', place.geometry.location.lat(), { shouldDirty: true });
        form.setValue('longitude', place.geometry.location.lng(), { shouldDirty: true });
    }
  };

  const onSubmit = async (values: ExpenseProviderFormValues) => {
    if (!id) return;
    try {
      const updatesToSend: Partial<ExpenseProvider> = { ...values };
      // Handle nullable document_type_id for Select component
      if (updatesToSend.document_type_id === '') {
        updatesToSend.document_type_id = null;
      }

      await updateProviderMutation.mutateAsync(updatesToSend);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const watchedLat = form.watch('latitude');
  const watchedLng = form.watch('longitude');

  if (isLoadingExpenseProvider) {
    return (
        <div className="space-y-8">
            <Skeleton className="h-10 w-1/4" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2"><Skeleton className="h-96 w-full" /></div>
                <div className="lg:col-span-1"><Skeleton className="h-96 w-full" /></div>
            </div>
        </div>
    );
  }

  if (!expenseProvider) {
    return <div>Proveedor de Gasto no encontrado.</div>;
  }

  return (
    <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <PageHeader 
                title={expenseProvider.name} 
                subtitle="Gestiona la información del proveedor de gasto."
                backButton={
                <Button variant="outline" size="icon" onClick={() => navigate('/app/expenses/providers')}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                }
            >
            </PageHeader>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <div className="md:hidden">
                        <Select onValueChange={setActiveTab} value={activeTab}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar una sección..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="general">General</SelectItem>
                                <SelectItem value="address">Dirección y Contacto Principal</SelectItem>
                                <SelectItem value="contacts">Contactos Adicionales</SelectItem>
                                <SelectItem value="addresses">Direcciones Adicionales</SelectItem>
                            </SelectContent>
                        </Select>
                        <div className="pt-4">
                            {activeTab === 'general' && (
                                <Card>
                                    <CardHeader><CardTitle>Información General</CardTitle></CardHeader>
                                    <CardContent className="pt-6">
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <FormField control={form.control} name="document_type_id" render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-sm font-medium">Tipo de Identificación</FormLabel>
                                                        <Select onValueChange={field.onChange} value={field.value || ""} disabled={isLoadingDocumentTypes}>
                                                            <FormControl><SelectTrigger><SelectValue placeholder="Selecciona tipo" /></SelectTrigger></FormControl>
                                                            <SelectContent>{isLoadingDocumentTypes ? <SelectItem value="loading" disabled>Cargando...</SelectItem> : documentTypes?.map((type) => (<SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>))}</SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )} />
                                                <FormField control={form.control} name="identification_number" render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-sm font-medium">Número de Identificación</FormLabel>
                                                        <FormControl><Input {...field} placeholder="Ej: 900123456-7" /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )} />
                                            </div>
                                            <FormField control={form.control} name="name" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-sm font-medium">Nombre del Proveedor</FormLabel>
                                                    <FormControl><Input {...field} placeholder="Ej: Compañía de Servicios Públicos" /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <FormField control={form.control} name="branch_ids" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-sm font-medium">Sucursales Asignadas</FormLabel>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild><FormControl><Button variant="outline" className="w-full justify-between"><span>{field.value?.length === 0 ? "Seleccionar sucursales" : `${field.value?.length} sucursal(es) seleccionada(s)`}</span><ChevronDown className="h-4 w-4 opacity-50" /></Button></FormControl></DropdownMenuTrigger>
                                                        <DropdownMenuContent className="w-[--radix-popover-trigger-width]">
                                                            <DropdownMenuLabel>Sucursales Disponibles</DropdownMenuLabel>
                                                            <DropdownMenuSeparator />
                                                            {branches?.map((branch) => (<DropdownMenuCheckboxItem key={branch.id} checked={field.value?.includes(branch.id)} onCheckedChange={(checked) => { const newValue = checked ? [...(field.value || []), branch.id] : (field.value || []).filter(id => id !== branch.id); field.onChange(newValue);}}>{branch.name}</DropdownMenuCheckboxItem>))}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                            {activeTab === 'address' && (
                                <Card>
                                    <CardHeader><CardTitle>Dirección y Contacto Principal</CardTitle></CardHeader>
                                    <CardContent className="pt-6">
                                        <div className="space-y-4">
                                            <FormField control={form.control} name="search_address" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-sm font-medium">Buscar Dirección</FormLabel>
                                                    <FormControl><AddressAutocompleteInput onPlaceSelected={handlePlaceSelected} defaultValue={expenseProvider?.address_line_1 || ''} isGlobalSearch={true} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <FormField control={form.control} name="address_line_1" render={({ field }) => (<FormItem><FormLabel className="text-sm font-medium">Línea 1 de Dirección</FormLabel><FormControl><Input {...field} readOnly /></FormControl><FormMessage /></FormItem>)} />
                                            <FormField control={form.control} name="address_line_2" render={({ field }) => (<FormItem><FormLabel className="text-sm font-medium">Línea 2 (Opcional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                <FormField control={form.control} name="city" render={({ field }) => (<FormItem><FormLabel className="text-sm font-medium">Ciudad</FormLabel><FormControl><Input {...field} readOnly /></FormControl><FormMessage /></FormItem>)} />
                                                <FormField control={form.control} name="state" render={({ field }) => (<FormItem><FormLabel className="text-sm font-medium">Estado/Provincia</FormLabel><FormControl><Input {...field} readOnly /></FormControl><FormMessage /></FormItem>)} />
                                                <FormField control={form.control} name="postal_code" render={({ field }) => (<FormItem><FormLabel className="text-sm font-medium">Código Postal</FormLabel><FormControl><Input {...field} readOnly /></FormControl><FormMessage /></FormItem>)} />
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel className="text-sm font-medium">Teléfono</FormLabel><FormControl><PhoneInput {...field} defaultCountryIsoCode={countryIsoCode} placeholderType='movil' /></FormControl><FormMessage /></FormItem>)} />
                                                <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel className="text-sm font-medium">Email</FormLabel><FormControl><Input type="email" {...field} placeholder="contacto@proveedor.com" /></FormControl><FormMessage /></FormItem>)} />
                                            </div>
                                            <div className="w-full mt-4 md:mt-0">
                                                {watchedLat !== null && watchedLng !== null && <div className="w-full h-full rounded-lg overflow-hidden mt-4"><MapDisplay latitude={watchedLat} longitude={watchedLng} /></div>}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                            {activeTab === 'contacts' && (
                                <Card>
                                    <CardHeader>
                                        <div className="flex justify-between items-center">
                                            <CardTitle>Contactos Adicionales</CardTitle>
                                            <ExpenseProviderContactDialog providerId={expenseProvider.id}>
                                                <Button type="button" variant="outline" size="icon">
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                            </ExpenseProviderContactDialog>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-6">
                                        <ExpenseProviderContactsManager providerId={expenseProvider.id} />
                                    </CardContent>
                                </Card>
                            )}
                            {activeTab === 'addresses' && (
                                <Card>
                                    <CardHeader>
                                        <div className="flex justify-between items-center">
                                            <CardTitle>Direcciones Adicionales</CardTitle>
                                            <Button type="button" variant="outline" size="icon" onClick={() => setIsAddingAddress(!isAddingAddress)}>
                                                                                                 <Plus className="h-4 w-4" />
                                                                                             </Button>
                                                                                         </div>
                                                                                     </CardHeader>
                                                                                     <CardContent className="pt-6">                                        <ExpenseProviderAddressesManager providerId={expenseProvider.id} isAdding={isAddingAddress} setIsAdding={setIsAddingAddress} />
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                    <div className="hidden md:block">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList>
                                <TabsTrigger value="general">General</TabsTrigger>
                                <TabsTrigger value="address">Dirección y Contacto Principal</TabsTrigger>
                                <TabsTrigger value="contacts">Contactos Adicionales</TabsTrigger>
                                <TabsTrigger value="addresses">Direcciones Adicionales</TabsTrigger>
                            </TabsList>
                            <TabsContent value="general">
                                <Card>
                                    <CardHeader><CardTitle>Información General</CardTitle></CardHeader>
                                    <CardContent className="pt-6">
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <FormField control={form.control} name="document_type_id" render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-sm font-medium">Tipo de Identificación</FormLabel>
                                                        <Select onValueChange={field.onChange} value={field.value || ""} disabled={isLoadingDocumentTypes}>
                                                            <FormControl><SelectTrigger><SelectValue placeholder="Selecciona tipo" /></SelectTrigger></FormControl>
                                                            <SelectContent>{isLoadingDocumentTypes ? <SelectItem value="loading" disabled>Cargando...</SelectItem> : documentTypes?.map((type) => (<SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>))}</SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )} />
                                                <FormField control={form.control} name="identification_number" render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-sm font-medium">Número de Identificación</FormLabel>
                                                        <FormControl><Input {...field} placeholder="Ej: 900123456-7" /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )} />
                                            </div>
                                            <FormField control={form.control} name="name" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-sm font-medium">Nombre del Proveedor</FormLabel>
                                                    <FormControl><Input {...field} placeholder="Ej: Compañía de Servicios Públicos" /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <FormField control={form.control} name="branch_ids" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-sm font-medium">Sucursales Asignadas</FormLabel>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild><FormControl><Button variant="outline" className="w-full justify-between"><span>{field.value?.length === 0 ? "Seleccionar sucursales" : `${field.value?.length} sucursal(es) seleccionada(s)`}</span><ChevronDown className="h-4 w-4 opacity-50" /></Button></FormControl></DropdownMenuTrigger>
                                                        <DropdownMenuContent className="w-[--radix-popover-trigger-width]">
                                                            <DropdownMenuLabel>Sucursales Disponibles</DropdownMenuLabel>
                                                            <DropdownMenuSeparator />
                                                            {branches?.map((branch) => (<DropdownMenuCheckboxItem key={branch.id} checked={field.value?.includes(branch.id)} onCheckedChange={(checked) => { const newValue = checked ? [...(field.value || []), branch.id] : (field.value || []).filter(id => id !== branch.id); field.onChange(newValue);}}>{branch.name}</DropdownMenuCheckboxItem>))}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                            <TabsContent value="address">
                                <Card>
                                    <CardHeader><CardTitle>Dirección y Contacto Principal</CardTitle></CardHeader>
                                    <CardContent className="pt-6">
                                        <div className="flex flex-col md:flex-row gap-4">
                                            <div className="w-full md:w-[70%] space-y-4">
                                                <FormField control={form.control} name="search_address" render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-sm font-medium">Buscar Dirección</FormLabel>
                                                        <FormControl><AddressAutocompleteInput onPlaceSelected={handlePlaceSelected} defaultValue={expenseProvider?.address_line_1 || ''} isGlobalSearch={true} /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )} />
                                                <FormField control={form.control} name="address_line_1" render={({ field }) => (<FormItem><FormLabel className="text-sm font-medium">Línea 1 de Dirección</FormLabel><FormControl><Input {...field} readOnly /></FormControl><FormMessage /></FormItem>)} />
                                                <FormField control={form.control} name="address_line_2" render={({ field }) => (<FormItem><FormLabel className="text-sm font-medium">Línea 2 (Opcional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <FormField control={form.control} name="city" render={({ field }) => (<FormItem><FormLabel className="text-sm font-medium">Ciudad</FormLabel><FormControl><Input {...field} readOnly /></FormControl><FormMessage /></FormItem>)} />
                                                    <FormField control={form.control} name="state" render={({ field }) => (<FormItem><FormLabel className="text-sm font-medium">Estado/Provincia</FormLabel><FormControl><Input {...field} readOnly /></FormControl><FormMessage /></FormItem>)} />
                                                    <FormField control={form.control} name="postal_code" render={({ field }) => (<FormItem><FormLabel className="text-sm font-medium">Código Postal</FormLabel><FormControl><Input {...field} readOnly /></FormControl><FormMessage /></FormItem>)} />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel className="text-sm font-medium">Teléfono</FormLabel><FormControl><PhoneInput {...field} defaultCountryIsoCode={countryIsoCode} placeholderType='movil' /></FormControl><FormMessage /></FormItem>)} />
                                                    <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel className="text-sm font-medium">Email</FormLabel><FormControl><Input type="email" {...field} placeholder="contacto@proveedor.com" /></FormControl><FormMessage /></FormItem>)} />
                                                </div>
                                            </div>
                                            <div className="w-full md:w-[30%] mt-4 md:mt-0">
                                                {watchedLat !== null && watchedLng !== null && <div className="w-full h-full rounded-lg overflow-hidden mt-4"><MapDisplay latitude={watchedLat} longitude={watchedLng} /></div>}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                            <TabsContent value="contacts">
                                <Card>
                                    <CardHeader>
                                        <div className="flex justify-between items-center">
                                            <CardTitle>Contactos Adicionales</CardTitle>
                                            <ExpenseProviderContactDialog providerId={expenseProvider.id}>
                                                <Button type="button" variant="outline">
                                                    <Plus className="h-4 w-4 mr-2" />
                                                    Añadir Contacto
                                                </Button>
                                            </ExpenseProviderContactDialog>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-6">
                                        <ExpenseProviderContactsManager providerId={expenseProvider.id} />
                                    </CardContent>
                                </Card>
                            </TabsContent>
                            <TabsContent value="addresses">
                                    <Card>
                                        <CardHeader>
                                            <div className="flex justify-between items-center">
                                                <CardTitle>Direcciones Adicionales</CardTitle>
                                                <Button type="button" variant="outline" onClick={() => setIsAddingAddress(!isAddingAddress)}>
                                                    <Plus className="h-4 w-4 mr-2" />
                                                    Añadir Dirección
                                                </Button>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="pt-6">
                                            <ExpenseProviderAddressesManager providerId={expenseProvider.id} isAdding={isAddingAddress} setIsAdding={setIsAddingAddress} />
                                        </CardContent>
                                    </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                    <div className="flex justify-end pt-8">
                        <Button type="submit" disabled={updateProviderMutation.isPending || !isDirty}>
                            <Save className="w-4 h-4 mr-2" />
                            {updateProviderMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
                        </Button>
                    </div>
                </div>
                <div className="lg:col-span-1">
                {expenseProvider && (
                    <ChatterBox 
                    resourceType="expense_providers"
                    resourceId={expenseProvider.id}
                    tenantId={expenseProvider.tenant_id}
                    containerClassName="h-[70vh] md:h-[calc(100vh-22rem)]"
                    />
                )}
                </div>
            </div>
        </form>
    </Form>
  );
}
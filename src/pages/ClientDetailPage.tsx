import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useClientDetails, useUpdateClient, Client } from '@/hooks/useClients';
import { PageHeader } from '@/components/PageHeader';
import { ClientForm } from '@/components/ClientForm';
import { ChatterBox } from '@/components/ChatterBox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBranches } from '@/hooks/useBranches';
import { useSubClients } from '@/hooks/useClients';
import { ClientDialog } from '@/components/ClientDialog';
import { Button } from '@/components/ui/button';
import { PlusCircle, ArrowLeft, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTenantClientSettings } from "@/hooks/useTenantClientSettings";
import { useClientDocumentTemplates } from "@/hooks/useClientDocumentTemplates";
import { useClientDocumentInstances, useSaveClientDocumentInstance } from "@/hooks/useClientDocumentInstances";
import { useClientConsentRecords } from "@/hooks/useClientConsentRecords";
import { FormViewerDialog } from "@/components/FormViewerDialog";
import { IntakeFormDialog } from "@/components/IntakeFormDialog";
import { ConsentManagerDialog } from "@/components/ConsentManagerDialog";

import { useAssignClientToBranch, useUnassignClientFromBranch } from '@/hooks/useClients';
import { useQueryClient } from '@tanstack/react-query';
import { AddressAutocompleteInput } from '@/components/AddressAutocompleteInput';
import { MapDisplay } from '@/components/MapDisplay';
import { PhoneInput } from '@/components/PhoneInput';
import { useScreenSize } from '@/hooks/useScreenSize';
import { useClientAddresses, useClientContacts } from '@/hooks/useClientRelations';
import { ClientAddressesManager } from './Clients/components/ClientAddressesManager';
import { ClientContactsManager, ClientContactDialog } from './Clients/components/ClientContactsManager';
import { useGetDocumentTypes } from '@/hooks/useDocumentTypes';
import { useTenantCountry } from '@/hooks/useTenantCountry';
import { useCountries } from '@/hooks/useCountries';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: client, isLoading, error } = useClientDetails(id || '');
  const { data: subClients, isLoading: isLoadingSubClients } = useSubClients(id || '');
  const updateMutation = useUpdateClient();
  const { data: branches, isLoading: isLoadingBranches } = useBranches();
  const assignClientToBranch = useAssignClientToBranch();
  const unassignClientFromBranch = useUnassignClientFromBranch();
  const queryClient = useQueryClient();
  const { data: documentTypes, isLoading: isLoadingDocumentTypes } = useGetDocumentTypes('client');
  const { data: countryId } = useTenantCountry(client?.tenant_id);
  const { data: countries } = useCountries();
  const [selectedBranchIds, setSelectedBranchIds] = React.useState<string[]>([]);

  const countryIsoCode = countries?.find(c => c.id === countryId)?.iso_code;

  // State for Forms & Consents
  const { data: tenantSettings } = useTenantClientSettings();
  const { data: documentTemplates } = useClientDocumentTemplates();
  const { data: clientDocumentInstances, isLoading: isLoadingInstances } = useClientDocumentInstances(id || '');
  const { mutate: saveDocumentInstance, isLoading: isSavingInstance } = useSaveClientDocumentInstance();
  const { data: clientConsentRecords, isLoading: isLoadingConsents } = useClientConsentRecords(id || '');
  const [isFormViewerOpen, setIsFormViewerOpen] = React.useState(false);
  const [selectedFormSchema, setSelectedFormSchema] = React.useState<any>({});
  const [selectedFormData, setSelectedFormData] = React.useState<any>({});
  const [selectedFormName, setSelectedFormName] = React.useState<string | undefined>(undefined);
  const [selectedFormVersion, setSelectedFormVersion] = React.useState<number | undefined>(undefined);
  const [isIntakeFormOpen, setIsIntakeFormOpen] = React.useState(false);
  const [isConsentManagerOpen, setIsConsentManagerOpen] = React.useState(false);
  const [isAddingAddress, setIsAddingAddress] = React.useState(false);
  const [isAddingContact, setIsAddingContact] = React.useState(false);
  const tabsListRef = React.useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = React.useState(false);
  const [showRightArrow, setShowRightArrow] = React.useState(false);

  const screenSize = useScreenSize();
  const isMobile = screenSize === 'sm' || screenSize === 'md';
  const [activeTab, setActiveTab] = React.useState('general');

  const handleScroll = () => {
    if (tabsListRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = tabsListRef.current;
        setShowLeftArrow(scrollLeft > 0);
        setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  React.useEffect(() => {
      const currentTabsList = tabsListRef.current;
      if (currentTabsList) {
          handleScroll();
          currentTabsList.addEventListener("scroll", handleScroll);
      }
      window.addEventListener("resize", handleScroll);
      return () => {
          if (currentTabsList) {
              currentTabsList.removeEventListener("scroll", handleScroll);
          }
          window.removeEventListener("resize", handleScroll);
      };
  }, [client]);

  const scroll = (direction: "left" | "right") => {
      if (tabsListRef.current) {
          const scrollAmount = direction === "left" ? -200 : 200;
          tabsListRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
      }
  };

  const form = useForm<Client>({
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      document_type_id: "",
      document_number: "",
      address_line_1: '',
      address_line_2: '',
      city: '',
      state: '',
      postal_code: '',
      country: '',
      latitude: null,
      longitude: null,
    }
  });

  useEffect(() => {
    if (client?.branches) {
      setSelectedBranchIds(client.branches.map(b => b.id).filter(Boolean) as string[]);
    }
  }, [client]);

  useEffect(() => {
    if (client) {
      form.reset({
        ...client,
        document_type_id: client.document_type_id || '',
        address_line_1: client.address_line_1 || '',
        address_line_2: client.address_line_2 || '',
        city: client.city || '',
        state: client.state || '',
        postal_code: client.postal_code || '',
        country: client.country || '',
        latitude: client.latitude || null,
        longitude: client.longitude || null,
      });
    }
  }, [client, form]);

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

  const onSubmit = (data: Client) => {
    if (!id) return;

    const allowedClientProps = [
      'name', 'phone', 'email', 'document_type_id', 'document_number', 'parent_client_id',
      'address_line_1', 'address_line_2', 'city', 'state', 'postal_code', 'country', 'latitude', 'longitude'
    ];
    const updatesToSend: Partial<Client> = {};
    for (const key in data) {
      if (allowedClientProps.includes(key as keyof Client)) {
        (updatesToSend as any)[key] = (data as any)[key];
      }
    }

    if (updatesToSend.document_type_id === '') {
        updatesToSend.document_type_id = null;
    }

    updateMutation.mutate({ clientId: id, updates: updatesToSend }, {
      onSuccess: () => {
        toast({ title: "Éxito", description: "Cliente actualizado correctamente.", variant: "success" });
        queryClient.invalidateQueries({ queryKey: ['chatter', 'clients', id] });
      },
      onError: (error: any) => {
        toast({ title: "Error", description: `Error al actualizar cliente: ${error.message}`, variant: "destructive" });
      }
    });
  };

  const handleBranchAssociationChange = (branchId: string, isAssociated: boolean) => {
    if (!id) return;
    const mutation = isAssociated ? assignClientToBranch : unassignClientFromBranch;
    mutation.mutate({ clientId: id, branchId }, {
      onSuccess: () => {
        const newSelectedBranchIds = isAssociated
          ? [...selectedBranchIds, branchId]
          : selectedBranchIds.filter(id => id !== branchId);
        setSelectedBranchIds(newSelectedBranchIds);
        toast({ title: "Éxito", description: `Asociación con la sucursal actualizada.`, variant: "success" });
        queryClient.invalidateQueries({ queryKey: ['chatter', 'clients', id] });
      },
      onError: (error: any) => {
        toast({ title: "Error", description: `No se pudo actualizar la asociación: ${error.message}`, variant: "destructive" })
      }
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-1/3" />
        <Card>
          <CardHeader><Skeleton className="h-8 w-1/4" /></CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (!client) {
    return <div>Cliente no encontrado.</div>;
  }

  return (
    <Form {...form}>
      <div className="space-y-8">
      <PageHeader 
        title={client.name} 
        subtitle="Edita la información del cliente y revisa su actividad."
        backButton={
          <Button variant="outline" size="icon" onClick={() => navigate('/app/clients')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        }
      />
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {isMobile ? (
              <div className="px-4">
                <Select onValueChange={setActiveTab} value={activeTab}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar una sección..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">Información</SelectItem>
                    <SelectItem value="main-address">Dirección Principal</SelectItem>
                    <SelectItem value="addresses">Direcciones Adicionales</SelectItem>
                    <SelectItem value="contacts">Contactos Adicionales</SelectItem>
                    <SelectItem value="branches">Sucursales</SelectItem>
                    <SelectItem value="family">Familiares</SelectItem>
                    <SelectItem value="forms-consents">Formularios</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="flex items-center">
                {showLeftArrow && (
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => scroll("left")}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                )}
                <div className="overflow-hidden w-full mx-2">
                  <TabsList ref={tabsListRef} onScroll={handleScroll} onClick={(e) => e.stopPropagation()} className="flex w-full overflow-x-auto no-scrollbar">
                    <TabsTrigger type="button" value="general">Información</TabsTrigger>
                    <TabsTrigger type="button" value="main-address">Dirección Principal</TabsTrigger>
                    <TabsTrigger type="button" value="addresses">Direcciones Adicionales</TabsTrigger>
                    <TabsTrigger type="button" value="contacts">Contactos Adicionales</TabsTrigger>
                    <TabsTrigger type="button" value="branches">Sucursales</TabsTrigger>
                    <TabsTrigger type="button" value="family">Familiares</TabsTrigger>
                    <TabsTrigger type="button" value="forms-consents">Formularios</TabsTrigger>
                  </TabsList>
                </div>
                {showRightArrow && (
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => scroll("right")}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                )}
              </div>
            )}
            <TabsContent value="general" className="mt-4">
              <Card>
                <CardHeader><CardTitle>Información General</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField control={form.control} name="document_type_id" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Tipo de Identificación</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value} required>
                            <FormControl><SelectTrigger><SelectValue placeholder="Selecciona tipo" /></SelectTrigger></FormControl>
                            <SelectContent>{isLoadingDocumentTypes ? <SelectItem value="loading" disabled>Cargando...</SelectItem> : documentTypes?.map((type) => (<SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>))}</SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="document_number" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Número de Identificación</FormLabel>
                          <FormControl><Input {...field} placeholder="Ej: 123456789" required /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Nombre Completo</FormLabel>
                        <FormControl><Input {...field} placeholder="Ej: Juan Pérez" required /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField control={form.control} name="phone" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Teléfono</FormLabel>
                <FormControl><PhoneInput {...field} defaultCountryIsoCode={countryIsoCode} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="email" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Email</FormLabel>
                          <FormControl><Input type="email" {...field} placeholder="ejemplo@dominio.com" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="branches" className="mt-4">
              <Card>
                <CardHeader><CardTitle>Asociar a Sucursales</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {isLoadingBranches ? <p>Cargando sucursales...</p> : branches?.map(branch => (
                    <div key={branch.id} className="flex items-center space-x-2">
                      <Checkbox id={`branch-${branch.id}`} checked={selectedBranchIds.includes(branch.id)} onCheckedChange={(checked) => handleBranchAssociationChange(branch.id, !!checked)} disabled={assignClientToBranch.isPending || unassignClientFromBranch.isPending} />
                      <Label htmlFor={`branch-${branch.id}`}>{branch.name}</Label>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="family" className="mt-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Miembros Familiares</CardTitle>
                  <ClientDialog parentClientId={client?.id} initialBranchIds={selectedBranchIds}>
                    <Button size="sm" type="button"><PlusCircle className="w-4 h-4 mr-2" />Añadir Familiar</Button>
                  </ClientDialog>
                </CardHeader>
                <CardContent>
                  {isLoadingSubClients ? <p>Cargando familiares...</p> : subClients && subClients.length > 0 ? (
                    <ul className="space-y-2">
                      {subClients.map(sub => (
                        <li key={sub.id} className="flex justify-between items-center p-2 bg-slate-50 rounded-md">
                          <span>{sub.name}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-500">Este cliente no tiene familiares asociados.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="forms-consents" className="mt-4 space-y-6">
              {documentTemplates?.find(t => t.id === tenantSettings?.default_intake_form_id) && (
                <div className="border p-4 rounded-md space-y-4">
                  <h4 className="text-lg font-semibold">Formulario de Admisión</h4>
                  <p className="text-sm text-slate-600">Plantilla por defecto: {documentTemplates.find(t => t.id === tenantSettings?.default_intake_form_id)?.name} (v{documentTemplates.find(t => t.id === tenantSettings?.default_intake_form_id)?.version})</p>
                  <Button type="button" onClick={() => setIsIntakeFormOpen(true)}>Llenar/Editar Formulario de Admisión</Button>
                </div>
              )}
              {(tenantSettings?.require_general_signature || tenantSettings?.require_image_consent) && (
                <div className="border p-4 rounded-md space-y-4">
                  <h4 className="text-lg font-semibold">Consentimientos</h4>
                  <p className="text-sm text-slate-600">Gestiona la firma general y el consentimiento de imágenes.</p>
                  <Button type="button" onClick={() => setIsConsentManagerOpen(true)}>Gestionar Consentimientos</Button>
                </div>
              )}
              <div className="border p-4 rounded-md space-y-4">
                <h4 className="text-lg font-semibold">Historial de Formularios</h4>
                {isLoadingInstances ? <p>Cargando historial de formularios...</p> : clientDocumentInstances && clientDocumentInstances.length > 0 ? (
                  <ul className="space-y-2">
                    {clientDocumentInstances.map(instance => (
                      <li key={instance.id} className="p-2 bg-slate-50 rounded-md">
                        <p className="font-medium">{instance.template?.name} (v{instance.template?.version})</p>
                        <p className="text-sm text-slate-600">Fecha: {new Date(instance.created_at).toLocaleDateString()}</p>
                        <Button variant="link" size="sm" type="button" onClick={() => {
                          setSelectedFormSchema(instance.template?.schema || {});
                          setSelectedFormData(instance.data);
                          setSelectedFormName(instance.template?.name);
                          setSelectedFormVersion(instance.template?.version);
                          setIsFormViewerOpen(true);
                        }}>Ver Datos</Button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500">No hay formularios llenados para este cliente.</p>
                )}
              </div>
              <div className="border p-4 rounded-md space-y-4">
                <h4 className="text-lg font-semibold">Historial de Consentimientos</h4>
                {isLoadingConsents ? <p>Cargando historial de consentimientos...</p> : clientConsentRecords && clientConsentRecords.length > 0 ? (
                  <ul className="space-y-2">
                    {clientConsentRecords.map(record => (
                      <li key={record.id} className="p-2 bg-slate-50 rounded-md">
                        <p className="font-medium">Tipo: {record.consent_type}</p>
                        <p className="text-sm text-slate-600">Fecha: {new Date(record.created_at).toLocaleDateString()}</p>
                        {record.signature_data && (
                          <div className="mt-2">
                            <p className="text-sm text-slate-600 mb-1">Firma registrada:</p>
                            <img src={record.signature_data} alt="Firma del cliente" className="w-32 h-auto border border-gray-300" />
                          </div>
                        )}
                        {record.metadata?.consented !== undefined && <p className="text-sm text-slate-600">Consentimiento de imagen: {record.metadata.consented ? 'Sí' : 'No'}</p>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500">No hay registros de consentimiento para este cliente.</p>
                )}
              </div>
            </TabsContent>
            <TabsContent value="main-address" className="mt-4">
              <Card>
                <CardHeader><CardTitle>Dirección Principal</CardTitle></CardHeader>
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="w-full md:w-[70%] space-y-4">
                      <FormField control={form.control} name="search_address" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Buscar Dirección</FormLabel>
                          <FormControl><AddressAutocompleteInput onPlaceSelected={handlePlaceSelected} defaultValue={client?.address_line_1 || ''} isGlobalSearch={true} /></FormControl>
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
                        <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel className="text-sm font-medium">Teléfono</FormLabel><FormControl><PhoneInput {...field} defaultCountryIsoCode={countryIsoCode} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel className="text-sm font-medium">Email</FormLabel><FormControl><Input type="email" {...field} placeholder="contacto@cliente.com" /></FormControl><FormMessage /></FormItem>)} />
                      </div>
                    </div>
                    <div className="w-full md:w-[30%] mt-4 md:mt-0">
                      {client?.latitude && client?.longitude && <div className="w-full h-full rounded-lg overflow-hidden mt-4"><MapDisplay latitude={client.latitude} longitude={client.longitude} /></div>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="addresses" className="mt-4">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Direcciones Adicionales</CardTitle>
                    <Button type="button" variant="outline" size="default" onClick={() => setIsAddingAddress(!isAddingAddress)}>
                      <Plus className="h-4 w-4" />
                      <span className="ml-2">Añadir Dirección</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <ClientAddressesManager clientId={client.id} isAdding={isAddingAddress} setIsAdding={setIsAddingAddress} />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="contacts" className="mt-4">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Contactos Adicionales</CardTitle>
                    <ClientContactDialog clientId={client.id}>
                      <Button type="button" variant="outline" size="default">
                        <Plus className="h-4 w-4" />
                        <span className="ml-2">Añadir Contacto</span>
                      </Button>
                    </ClientContactDialog>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <ClientContactsManager clientId={client.id} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          <div className="flex justify-end pt-8">
              <Button type="submit" disabled={!form.formState.isDirty || updateMutation.isPending}>
                  Guardar Cambios
              </Button>
          </div>
        </div>
        <div>
          <ChatterBox resourceType="clients" resourceId={client.id} tenantId={client.tenant_id} containerClassName="h-[calc(100vh-22rem)]" />
        </div>
      </form>
    </div>
    </Form>
  );
}
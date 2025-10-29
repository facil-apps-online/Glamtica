
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ClientForm } from '@/components/ClientForm';
import { useForm, Controller } from "react-hook-form";
import { Client, useCreateClient, useUpdateClient, useClientDetails, useSubClients, useAssignClientToBranch, useUnassignClientFromBranch } from "@/hooks/useClients";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useTenantClientSettings } from "@/hooks/useTenantClientSettings";
import { useClientDocumentTemplates } from "@/hooks/useClientDocumentTemplates";
import { useClientDocumentInstances, useSaveClientDocumentInstance } from "@/hooks/useClientDocumentInstances";
import { useClientConsentRecords } from "@/hooks/useClientConsentRecords";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle } from "lucide-react";
import { useBranches } from "@/hooks/useBranches";
import { MultiSelect } from "@/components/ui/MultiSelect";
import { FormViewerDialog } from "@/components/FormViewerDialog";
import { IntakeFormDialog } from "@/components/IntakeFormDialog";
import { ConsentManagerDialog } from "@/components/ConsentManagerDialog";
import { ChatterBox } from "@/components/ChatterBox";
import { useScreenSize, type ScreenSize } from "@/hooks/useScreenSize";

interface ClientDialogProps {
  children: React.ReactNode;
  client?: Partial<Client>;
  isEdit?: boolean;
  onClientCreated?: (clientId: string) => void;
  initialBranchIds?: string[];
  parentClientId?: string; // Para crear un sub-cliente
  onOpenChange?: (open: boolean) => void;
}

import { useAuth } from "@/contexts/AuthContext";

export const ClientDialog = ({
  children,
  client,
  isEdit = false,
  onClientCreated,
  initialBranchIds = [],
  parentClientId,
  onOpenChange
}: ClientDialogProps) => {
  const { tenant } = useAuth();
  const [open, setOpen] = useState(false);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    onOpenChange?.(isOpen);
  };
  const queryClient = useQueryClient();
  const createMutation = useCreateClient();
  const updateMutation = useUpdateClient();
  const assignClientToBranch = useAssignClientToBranch();
  const unassignClientFromBranch = useUnassignClientFromBranch();
  const { toast } = useToast();
  const { data: branches, isLoading: isLoadingBranches } = useBranches();
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>(initialBranchIds);

  const { data: tenantSettings } = useTenantClientSettings();
  const { data: documentTemplates } = useClientDocumentTemplates();
  const { data: clientDocumentInstances, isLoading: isLoadingInstances } = useClientDocumentInstances(client?.id || '');
  const { mutate: saveDocumentInstance, isLoading: isSavingInstance } = useSaveClientDocumentInstance();
  const { data: clientConsentRecords, isLoading: isLoadingConsents } = useClientConsentRecords(client?.id || '');

  const [activeTab, setActiveTab] = useState('general');
  const [isFormViewerOpen, setIsFormViewerOpen] = useState(false);
  const [selectedFormSchema, setSelectedFormSchema] = useState<any>({});
  const [selectedFormData, setSelectedFormData] = useState<any>({});
  const [selectedFormName, setSelectedFormName] = useState<string | undefined>(undefined);
  const [selectedFormVersion, setSelectedFormVersion] = useState<number | undefined>(undefined);

  const [isIntakeFormOpen, setIsIntakeFormOpen] = useState(false);
  const [isConsentManagerOpen, setIsConsentManagerOpen] = useState(false);

  const screenSize: ScreenSize = useScreenSize();
  const isMobile = screenSize === 'sm' || screenSize === 'md';

  const defaultIntakeTemplate = documentTemplates?.find(
    (template) => template.id === tenantSettings?.default_intake_form_id
  );

  const { data: parentClient } = useClientDetails(parentClientId || client?.parent_client_id || '');
  const { data: subClients, isLoading: isLoadingSubClients } = useSubClients(client?.id || '');

  const form = useForm<Client>({
    defaultValues: client || {
      name: "",
      phone: "",
      email: "",
      document_type_id: "",
      document_number: "",
      parent_client_id: parentClientId
    },
  });


  useEffect(() => {
    if (open) {
      const defaultValues = client ? { ...client } : { name: "", phone: "", email: "", document_type: "", document_number: "" };
      if (parentClientId) {
        defaultValues.parent_client_id = parentClientId;
      }
      form.reset(defaultValues);
      
      if (isEdit && client?.client_branches) {
        setSelectedBranchIds(client.client_branches.map(cb => cb.branches?.id).filter(Boolean) as string[]);
      } else {
        setSelectedBranchIds(initialBranchIds);
      }
    }
  }, [open, isEdit, client, parentClientId, form.reset, initialBranchIds]);

  const handleCopyParentData = (checked: boolean) => {
    if (checked && parentClient) {
      form.setValue('phone', parentClient.phone);
      form.setValue('email', parentClient.email || '');
    } else {
      form.setValue('phone', '');
      form.setValue('email', '');
    }
  };

  const onSubmitGeneral = (data: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => {
    if (isEdit && client?.id) {
      const allowedClientProps = [
        'name', 'phone', 'email', 'document_type_id', 'document_number', 'parent_client_id'
      ];
      const updatesToSend: Partial<Client> = {};
      for (const key in data) {
        if (allowedClientProps.includes(key as keyof Client)) {
          (updatesToSend as any)[key] = (data as any)[key];
        }
      }
      updateMutation.mutate(
        { clientId: client.id, updates: updatesToSend },
        {
          onSuccess: () => {
            toast({ title: "Éxito", description: "Cliente actualizado correctamente.", variant: "success" });
            queryClient.invalidateQueries({ queryKey: ['chatter', 'clients', client.id] });
          },
          onError: (error: any) => toast({ title: "Error", description: `Error al actualizar cliente: ${error.message}`, variant: "destructive" })
        }
      );
    } else {
      if (selectedBranchIds.length === 0) {
        toast({ title: "Error", description: "Debes seleccionar al menos una sucursal para crear el cliente.", variant: "destructive" });
        return;
      }
      createMutation.mutate({ clientData: data, branchIds: selectedBranchIds }, {
        onSuccess: (newClient) => {
          toast({ title: "Éxito", description: "Cliente creado correctamente.", variant: "success" });
          setOpen(false);
          if (onClientCreated && newClient?.id) {
            onClientCreated(newClient.id);
          }
        },
        onError: (error: any) => toast({ title: "Error", description: `Error al crear cliente: ${error.message}`, variant: "destructive" })
      });
    }
  };

  const handleBranchAssociationChange = (branchId: string, isAssociated: boolean) => {
    if (!client?.id) return;
    const mutation = isAssociated ? assignClientToBranch : unassignClientFromBranch;
    mutation.mutate({ clientId: client.id, branchId }, {
      onSuccess: () => {
        const newSelectedBranchIds = isAssociated
          ? [...selectedBranchIds, branchId]
          : selectedBranchIds.filter(id => id !== branchId);
        setSelectedBranchIds(newSelectedBranchIds);
        toast({ title: "Éxito", description: `Asociación con la sucursal actualizada.`, variant: "success" });
        queryClient.invalidateQueries({ queryKey: ['chatter', 'clients', client.id] });
      },
      onError: (error: any) => {
        toast({ title: "Error", description: `No se pudo actualizar la asociación: ${error.message}`, variant: "destructive" })
      }
    });
  };

  const branchOptions = branches?.map(branch => ({ value: branch.id, label: branch.name })) || [];

  const tabs = [
    { value: "general", label: "Información", disabled: false },
    { value: "branches", label: "Sucursales", disabled: !isEdit },
    { value: "family", label: "Familiares", disabled: !isEdit },
    { value: "forms-consents", label: "Formularios", disabled: !isEdit },
    { value: "chatter", label: "Actividad", disabled: !isEdit },
  ];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent onInteractOutside={(e) => { e.preventDefault(); e.stopPropagation(); handleOpenChange(false); }} onClick={(e) => e.stopPropagation()} className="w-[95vw] sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Cliente" : "Añadir Cliente"}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Gestiona la información y asociaciones del cliente' : 'Completa la información del nuevo cliente'}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {isMobile ? (
            <div className="px-1 mb-4">
              <Select value={activeTab} onValueChange={setActiveTab}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una sección" />
                </SelectTrigger>
                <SelectContent>
                  {tabs.map(tab => (
                    <SelectItem key={tab.value} value={tab.value} disabled={tab.disabled}>
                      {tab.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <TabsList className="flex flex-wrap h-auto justify-start">
              {tabs.map(tab => (
                <TabsTrigger key={tab.value} value={tab.value} disabled={tab.disabled} className="whitespace-normal text-center h-auto">
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          )}

          <TabsContent value="general" className="mt-4">
            <ClientForm form={form} onSubmit={onSubmitGeneral} isEdit={isEdit} isLoading={createMutation.isPending || updateMutation.isPending || isLoadingBranches} countryId={tenant?.country_id} />
          </TabsContent>

          <TabsContent value="branches" className="mt-4 space-y-4">
            <div className="border p-4 rounded-md">
              <h4 className="text-lg font-semibold mb-4">Asociar a Sucursales</h4>
              <div className="space-y-2">
                {isLoadingBranches ? <p>Cargando sucursales...</p> : branches?.map(branch => (
                  <div key={branch.id} className="flex items-center space-x-2">
                    <Checkbox id={`branch-${branch.id}`} checked={selectedBranchIds.includes(branch.id)} onCheckedChange={(checked) => handleBranchAssociationChange(branch.id, !!checked)} disabled={assignClientToBranch.isPending || unassignClientFromBranch.isPending} />
                    <Label htmlFor={`branch-${branch.id}`}>{branch.name}</Label>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="family" className="mt-4 space-y-6">
            <div className="border p-4 rounded-md space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-lg font-semibold">Miembros Familiares</h4>
                <ClientDialog parentClientId={client?.id} initialBranchIds={selectedBranchIds}>
                  <Button size="sm"><PlusCircle className="w-4 h-4 mr-2" />Añadir Familiar</Button>
                </ClientDialog>
              </div>
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
            </div>
          </TabsContent>

          <TabsContent value="forms-consents" className="mt-4 space-y-6">
            {defaultIntakeTemplate && (
              <div className="border p-4 rounded-md space-y-4">
                <h4 className="text-lg font-semibold">Formulario de Admisión</h4>
                <p className="text-sm text-slate-600">Plantilla por defecto: {defaultIntakeTemplate.name} (v{defaultIntakeTemplate.version})</p>
                <Button onClick={() => setIsIntakeFormOpen(true)}>Llenar/Editar Formulario de Admisión</Button>
              </div>
            )}
            {(tenantSettings?.require_general_signature || tenantSettings?.require_image_consent) && (
              <div className="border p-4 rounded-md space-y-4">
                <h4 className="text-lg font-semibold">Consentimientos</h4>
                <p className="text-sm text-slate-600">Gestiona la firma general y el consentimiento de imágenes.</p>
                <Button onClick={() => setIsConsentManagerOpen(true)}>Gestionar Consentimientos</Button>
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
                      <Button variant="link" size="sm" onClick={() => {
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

          <TabsContent value="chatter" className="mt-4">
            <ChatterBox
              resourceType="clients"
              resourceId={client?.id || ''}
              tenantId={tenant?.id || ''}
            />
          </TabsContent>


        </Tabs>
      </DialogContent>
      <FormViewerDialog
        open={isFormViewerOpen}
        onOpenChange={setIsFormViewerOpen}
        schema={selectedFormSchema}
        formData={selectedFormData}
        formName={selectedFormName}
        formVersion={selectedFormVersion}
      />
      {defaultIntakeTemplate && (
        <IntakeFormDialog
          open={isIntakeFormOpen}
          onOpenChange={setIsIntakeFormOpen}
          template={defaultIntakeTemplate}
          initialFormData={clientDocumentInstances?.find(inst => inst.template_id === defaultIntakeTemplate.id)?.data || {}}
          onSave={async (formData) => {
            if (client?.id && defaultIntakeTemplate) {
              await saveDocumentInstance({ client_id: client.id, template_id: defaultIntakeTemplate.id, data: formData }, {
                onSuccess: () => {
                  toast({ title: "Éxito", description: "Formulario de admisión guardado.", variant: "success" });
                  setIsIntakeFormOpen(false);
                },
                onError: (error: any) => toast({ title: "Error", description: `Error al guardar formulario: ${error.message}`, variant: "destructive" }),
              });
            } else {
              toast({ title: "Error", description: "Cliente o plantilla no identificados para guardar formulario.", variant: "destructive" });
            }
          }}
          isSaving={isSavingInstance}
        />
      )}
      <ConsentManagerDialog
        open={isConsentManagerOpen}
        onOpenChange={setIsConsentManagerOpen}
        clientId={client?.id || ''}
        initialSignatureData={clientConsentRecords?.find(rec => rec.consent_type === 'general_signature')?.signature_data}
        initialImageConsent={!!clientConsentRecords?.find(rec => rec.consent_type === 'image_use')}
        requireGeneralSignature={tenantSettings?.require_general_signature ?? false}
        requireImageConsent={tenantSettings?.require_image_consent ?? false}
      />
    </Dialog>
  );
};
import { useEffect, useState } from "react";
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
import { useForm, Controller } from "react-hook-form";
import { Client, useCreateClient, useUpdateClient, useClientDetails, useSubClients, useAssignClientToBranch, useUnassignClientFromBranch } from "@/hooks/useClients";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DynamicFormRenderer } from "@/components/DynamicFormRenderer";
import { SignaturePad } from "@/components/SignaturePad";
import { Checkbox } from "@/components/ui/checkbox";
import {
  useTenantClientSettings,
} from "@/hooks/useTenantClientSettings";
import { useClientDocumentTemplates } from "@/hooks/useClientDocumentTemplates";
import {
  useClientDocumentInstances,
  useSaveClientDocumentInstance,
} from "@/hooks/useClientDocumentInstances";
import {
  useClientConsentRecords,
  useSaveClientConsentRecord,
} from "@/hooks/useClientConsentRecords";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle } from "lucide-react";
import { useBranches } from "@/hooks/useBranches";
import { MultiSelect } from "@/components/ui/MultiSelect";

const documentTypes = [
  { value: "cc", label: "Cédula de Ciudadanía" },
  { value: "ce", label: "Cédula de Extranjería" },
  { value: "nit", label: "NIT" },
  { value: "passport", label: "Pasaporte" },
  { value: "other", label: "Otro" },
];

interface ClientDialogProps {
  children: React.ReactNode;
  client?: Partial<Client>;
  isEdit?: boolean;
  onClientCreated?: (clientId: string) => void;
  initialBranchIds?: string[];
  parentClientId?: string; // Para crear un sub-cliente
}

export const ClientDialog = ({ 
  children, 
  client, 
  isEdit = false, 
  onClientCreated, 
  initialBranchIds = [],
  parentClientId
}: ClientDialogProps) => {
  const [open, setOpen] = useState(false);
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
  const { mutate: saveConsentRecord, isLoading: isSavingConsent } = useSaveClientConsentRecord();

  const [activeTab, setActiveTab] = useState('general');
  const [dynamicFormData, setDynamicFormData] = useState<{ [key: string]: any }>({});
  const [signatureData, setSignatureData] = useState<string | undefined>(undefined);
  const [imageConsent, setImageConsent] = useState<boolean>(false);

  const defaultIntakeTemplate = documentTemplates?.find(
    (template) => template.id === tenantSettings?.default_intake_form_id
  );

  const { data: parentClient } = useClientDetails(parentClientId || client?.parent_client_id || '');
  const { data: subClients, isLoading: isLoadingSubClients } = useSubClients(client?.id || '');

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm<Client>({
    defaultValues: client || {
      name: "",
      phone: "",
      email: "",
      document_type: "",
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
      reset(defaultValues);
      
      if (isEdit && client?.client_branches) {
        setSelectedBranchIds(client.client_branches.map(cb => cb.branches?.id).filter(Boolean) as string[]);
      } else {
        setSelectedBranchIds(initialBranchIds);
      }

      if (isEdit && client?.id) {
        const lastDefaultInstance = clientDocumentInstances?.find(
          (instance) => instance.template_id === tenantSettings?.default_intake_form_id
        );
        if (lastDefaultInstance) {
          setDynamicFormData(lastDefaultInstance.data);
        }

        const generalSignatureRecord = clientConsentRecords?.find(rec => rec.consent_type === 'general_signature');
        if (generalSignatureRecord) {
          setSignatureData(generalSignatureRecord.signature_data);
        }
        const imageConsentRecord = clientConsentRecords?.find(rec => rec.consent_type === 'image_use');
        if (imageConsentRecord) {
          setImageConsent(true);
        }
      }
    }
  }, [open, isEdit, client, parentClientId, clientDocumentInstances, clientConsentRecords, tenantSettings, reset, initialBranchIds]);

  const handleCopyParentData = (checked: boolean) => {
    if (checked && parentClient) {
      setValue('phone', parentClient.phone);
      setValue('email', parentClient.email || '');
    } else {
      setValue('phone', '');
      setValue('email', '');
    }
  };

  const onSubmitGeneral = (data: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => {
    if (isEdit && client?.id) {
      updateMutation.mutate(
        { clientId: client.id, updates: data },
        {
          onSuccess: () => {
            toast({ title: "Éxito", description: "Cliente actualizado correctamente." });
            // No cerramos el dialogo en modo edicion para poder cambiar de pestaña
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
          toast({ title: "Éxito", description: "Cliente creado correctamente." });
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
        toast({ title: "Éxito", description: `Asociación con la sucursal actualizada.` });
      },
      onError: (error: any) => {
        toast({ title: "Error", description: `No se pudo actualizar la asociación: ${error.message}`, variant: "destructive" });
      }
    });
  };

  const branchOptions = branches?.map(branch => ({ value: branch.id, label: branch.name })) || [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="w-[95vw] sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar Cliente" : "Añadir Cliente"}
          </DialogTitle>
          <DialogDescription>
            {isEdit 
              ? 'Gestiona la información y asociaciones del cliente' 
              : 'Completa la información del nuevo cliente'
            }
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">Información</TabsTrigger>
            <TabsTrigger value="branches" disabled={!isEdit}>Sucursales</TabsTrigger>
            <TabsTrigger value="family" disabled={!isEdit}>Familiares</TabsTrigger>
            <TabsTrigger value="forms-consents" disabled={!isEdit}>Formularios</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-4">
            <form onSubmit={handleSubmit(onSubmitGeneral)} className="space-y-4">
              {parentClient && (
                <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-md space-y-3">
                  <p className="text-sm text-blue-800">Este es un familiar de: <strong>{parentClient.name}</strong></p>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="copy-parent-data" onCheckedChange={handleCopyParentData} />
                    <Label htmlFor="copy-parent-data" className="text-sm font-medium">Usar los mismos datos de contacto del padre</Label>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre</Label>
                  <Input
                    id="name"
                    {...register("name", { required: "El nombre es obligatorio" })}
                    placeholder="Nombre completo del cliente"
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    {...register("phone")}
                    placeholder="+34 666 123 456"
                  />
                  {errors.phone && (
                    <p className="text-sm text-red-600">{errors.phone.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="document_type">Tipo de Documento</Label>
                  <Controller
                    name="document_type"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {documentTypes.map(doc => (
                            <SelectItem key={doc.value} value={doc.value}>{doc.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="document_number">Número de Documento</Label>
                  <Input
                    id="document_number"
                    {...register("document_number")}
                    placeholder="123456789"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register("email")}
                    placeholder="email@ejemplo.com"
                  />
                </div>
                
                {!isEdit && (
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="branches">Sucursales Iniciales</Label>
                    <MultiSelect
                      options={branchOptions}
                      selected={selectedBranchIds}
                      onSelectedChange={setSelectedBranchIds}
                      placeholder="Selecciona una o más sucursales"
                      className="w-full"
                    />
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending || isLoadingBranches}
                >
                  {isEdit ? "Guardar Cambios" : "Guardar"}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="branches" className="mt-4 space-y-4">
            <div className="border p-4 rounded-md">
              <h4 className="text-lg font-semibold mb-4">Asociar a Sucursales</h4>
              <div className="space-y-2">
                {isLoadingBranches ? (
                  <p>Cargando sucursales...</p>
                ) : (
                  branches?.map(branch => (
                    <div key={branch.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`branch-${branch.id}`}
                        checked={selectedBranchIds.includes(branch.id)}
                        onCheckedChange={(checked) => handleBranchAssociationChange(branch.id, !!checked)}
                        disabled={assignClientToBranch.isPending || unassignClientFromBranch.isPending}
                      />
                      <Label htmlFor={`branch-${branch.id}`}>{branch.name}</Label>
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="family" className="mt-4 space-y-6">
            <div className="border p-4 rounded-md space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-lg font-semibold">Miembros Familiares</h4>
                <ClientDialog 
                  parentClientId={client?.id} 
                  initialBranchIds={selectedBranchIds}
                >
                  <Button size="sm">
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Añadir Familiar
                  </Button>
                </ClientDialog>
              </div>
              {isLoadingSubClients ? (
                <p>Cargando familiares...</p>
              ) : subClients && subClients.length > 0 ? (
                <ul className="space-y-2">
                  {subClients.map(sub => (
                    <li key={sub.id} className="flex justify-between items-center p-2 bg-slate-50 rounded-md">
                      <span>{sub.name}</span>
                      {/* Aquí se podría añadir un botón para editar el familiar */}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">Este cliente no tiene familiares asociados.</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="forms-consents" className="mt-4 space-y-6">
            {/* ... El contenido de esta pestaña no cambia por ahora ... */}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
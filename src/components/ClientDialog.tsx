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
import { Client, useCreateClient, useUpdateClient, useClientDetails, useSubClients } from "@/hooks/useClients";
import { useTranslation } from "@/hooks/useTranslations";
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
  initialBranchId?: string;
  parentClientId?: string; // Para crear un sub-cliente
}

export const ClientDialog = ({ 
  children, 
  client, 
  isEdit = false, 
  onClientCreated, 
  initialBranchId,
  parentClientId
}: ClientDialogProps) => {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  const createMutation = useCreateClient();
  const updateMutation = useUpdateClient();
  const { toast } = useToast();

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
  }, [open, isEdit, client, parentClientId, clientDocumentInstances, clientConsentRecords, tenantSettings, reset]);

  const onSubmitGeneral = (data: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => {
    if (isEdit && client?.id) {
      updateMutation.mutate(
        { clientId: client.id, updates: data },
        {
          onSuccess: () => {
            toast({ title: "Éxito", description: "Cliente actualizado correctamente." });
            setOpen(false);
          },
          onError: (error: any) => toast({ title: "Error", description: `Error al actualizar cliente: ${error.message}`, variant: "destructive" })
        }
      );
    } else {
      if (!initialBranchId) {
        toast({ title: "Error", description: "Falta la sucursal inicial para crear el cliente.", variant: "destructive" });
        return;
      }
      createMutation.mutate({ clientData: data, branchIds: [initialBranchId] }, {
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

  // ... (handleSaveFormsAndConsents remains the same for now)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="w-[95vw] sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t('clients.edit') : t('clients.add')}
          </DialogTitle>
          <DialogDescription>
            {isEdit 
              ? 'Edita los datos del cliente' 
              : 'Completa la información del nuevo cliente'
            }
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">Información General</TabsTrigger>
            <TabsTrigger value="family" disabled={!isEdit}>Familiares</TabsTrigger>
            <TabsTrigger value="forms-consents" disabled={!isEdit}>Formularios</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-4">
            <form onSubmit={handleSubmit(onSubmitGeneral)} className="space-y-4">
              {parentClient && (
                <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-md">
                  <p className="text-sm text-blue-800">Este es un familiar de: <strong>{parentClient.name}</strong></p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('clients.name')}</Label>
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
                  <Label htmlFor="phone">{t('clients.phone')}</Label>
                  <Input
                    id="phone"
                    {...register("phone", { required: "El teléfono es obligatorio" })}
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
                  <Label htmlFor="email">{t('clients.email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register("email")}
                    placeholder="email@ejemplo.com"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {t('common.save')}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="family" className="mt-4 space-y-6">
            <div className="border p-4 rounded-md space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-lg font-semibold">Miembros Familiares</h4>
                <ClientDialog 
                  parentClientId={client?.id} 
                  initialBranchId={initialBranchId}
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
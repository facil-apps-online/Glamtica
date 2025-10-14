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
import { PlusCircle, ArrowLeft } from 'lucide-react';
import { useTenantClientSettings } from "@/hooks/useTenantClientSettings";
import { useClientDocumentTemplates } from "@/hooks/useClientDocumentTemplates";
import { useClientDocumentInstances, useSaveClientDocumentInstance } from "@/hooks/useClientDocumentInstances";
import { useClientConsentRecords } from "@/hooks/useClientConsentRecords";
import { FormViewerDialog } from "@/components/FormViewerDialog";
import { IntakeFormDialog } from "@/components/IntakeFormDialog";
import { ConsentManagerDialog } from "@/components/ConsentManagerDialog";

import { useAssignClientToBranch, useUnassignClientFromBranch } from '@/hooks/useClients';
import { useQueryClient } from '@tanstack/react-query';

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
  const [selectedBranchIds, setSelectedBranchIds] = React.useState<string[]>([]);

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

  const form = useForm<Client>({
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      document_type_id: "",
      document_number: "",
    }
  });

  useEffect(() => {
    if (client?.branches) {
      setSelectedBranchIds(client.branches.map(b => b.id).filter(Boolean) as string[]);
    }
  }, [client]);

  useEffect(() => {
    if (client) {
      form.reset(client);
    }
  }, [client, form]);

  const onSubmit = (data: Client) => {
    if (!id) return;

    const allowedClientProps = [
      'name', 'phone', 'email', 'document_type_id', 'document_number', 'parent_client_id'
    ];
    const updatesToSend: Partial<Client> = {};
    for (const key in data) {
      if (allowedClientProps.includes(key as keyof Client)) {
        (updatesToSend as any)[key] = (data as any)[key];
      }
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general">Información</TabsTrigger>
              <TabsTrigger value="branches">Sucursales</TabsTrigger>
              <TabsTrigger value="family">Familiares</TabsTrigger>
              <TabsTrigger value="forms-consents">Formularios</TabsTrigger>
            </TabsList>
            <TabsContent value="general" className="mt-4">
              <Card>
                <CardHeader><CardTitle>Información General</CardTitle></CardHeader>
                <CardContent>
                  <ClientForm form={form} onSubmit={onSubmit} isEdit={true} isLoading={updateMutation.isPending} />
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
                    <Button size="sm"><PlusCircle className="w-4 h-4 mr-2" />Añadir Familiar</Button>
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
          </Tabs>
        </div>
        <div>
          <ChatterBox resourceType="clients" resourceId={client.id} tenantId={client.tenant_id} containerClassName="h-[calc(100vh-22rem)]" />
        </div>
      </div>
    </div>
  );
}
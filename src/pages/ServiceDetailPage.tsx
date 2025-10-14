
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMasterServiceDetails, useUpdateMasterService } from '@/hooks/useServices';
import { useServiceTaxTypes, useAddServiceTaxType, useRemoveServiceTaxType } from "@/hooks/useServiceTaxTypes";
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ServiceForm } from '@/components/ServiceForm';
import { ServicePricesTab } from '@/components/ServicePricesTab';
import { ServiceCommissionsTab } from '@/components/ServiceCommissionsTab';
import { ServiceAssignmentTab } from '@/components/ServiceAssignmentTab';
import { ChatterBox } from '@/components/ChatterBox';
import { MasterService } from '@/types/services';
import { useToast } from "@/hooks/use-toast";

type ServiceFormData = Partial<MasterService & { tax_type_ids: string[] }>;

export default function ServiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: service, isLoading, error, refetch: refetchServiceDetails } = useMasterServiceDetails(id || '');
  const { mutate: updateService, isPending: isUpdating } = useUpdateMasterService();
  const { data: existingTaxTypes, refetch: refetchServiceTaxTypes } = useServiceTaxTypes(id || '');
  const { mutate: addServiceTaxType } = useAddServiceTaxType();
  const { mutate: removeServiceTaxType } = useRemoveServiceTaxType();

  const form = useForm<ServiceFormData>({
    defaultValues: {
      name: '',
      description: '',
      duration_minutes: 0,
      category_id: undefined,
      tax_type_ids: [],
    }
  });

  useEffect(() => {
    if (service) {
      const tax_type_ids = existingTaxTypes?.map(st => st.tax_type_id) || [];
      form.reset({
        ...service,
        tax_type_ids,
      });
    }
  }, [service, existingTaxTypes, form]);

  const handleTaxTypeUpdates = (serviceId: string, selectedTaxTypeIds: string[]) => {
    if (!serviceId) return;
    const currentTaxTypeIds = existingTaxTypes?.map(st => st.tax_type_id) || [];
    const taxTypesToAdd = selectedTaxTypeIds.filter(id => !currentTaxTypeIds.includes(id));
    taxTypesToAdd.forEach(taxTypeId => addServiceTaxType({ service_id: serviceId, tax_type_id: taxTypeId }));
    const taxTypesToRemove = currentTaxTypeIds.filter(id => !selectedTaxTypeIds.includes(id));
    taxTypesToRemove.forEach(taxTypeId => {
      const serviceTaxType = existingTaxTypes?.find(st => st.tax_type_id === taxTypeId);
      if (serviceTaxType) removeServiceTaxType({ id: serviceTaxType.id });
    });
    refetchServiceTaxTypes();
  };

  const onSubmit = (data: ServiceFormData) => {
    if (!id) return;
    const { tax_type_ids = [], ...serviceData } = data;
    updateService({ id, updates: serviceData }, {
      onSuccess: (updatedService) => {
        handleTaxTypeUpdates(updatedService.id, tax_type_ids);
        toast({ title: "Éxito", description: "Servicio actualizado correctamente.", variant: "success" });
        refetchServiceDetails();
      },
      onError: (error) => {
        toast({ title: "Error", description: `Error al actualizar servicio: ${error.message}`, variant: "destructive" });
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
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) return <div>Error: {error.message}</div>;
  if (!service) return <div>Servicio no encontrado.</div>;

  return (
    <div className="space-y-8">
      <PageHeader
        title={service.name}
        subtitle="Gestiona todos los aspectos del servicio."
        backButton={
          <Button variant="outline" size="icon" onClick={() => navigate('/app/services')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        }
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="info">Información</TabsTrigger>
              <TabsTrigger value="prices">Precios</TabsTrigger>
              <TabsTrigger value="commissions">Comisiones</TabsTrigger>
              <TabsTrigger value="assignment">Asignación</TabsTrigger>
            </TabsList>
            <TabsContent value="info" className="mt-4">
              <Card>
                <CardHeader><CardTitle>Información General</CardTitle></CardHeader>
                <CardContent>
                  <ServiceForm
                    form={form}
                    onSubmit={onSubmit}
                    isEdit={true}
                    isLoading={isUpdating}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="prices" className="mt-4">
              <Card>
                <CardHeader><CardTitle>Precios por Sucursal</CardTitle></CardHeader>
                <CardContent>
                  <ServicePricesTab service={service} />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="commissions" className="mt-4">
              <Card>
                <CardHeader><CardTitle>Comisiones</CardTitle></CardHeader>
                <CardContent>
                  <ServiceCommissionsTab serviceId={service.id} serviceName={service.name} />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="assignment" className="mt-4">
              <Card>
                <CardHeader><CardTitle>Asignación a Sucursales</CardTitle></CardHeader>
                <CardContent>
                  <ServiceAssignmentTab service={service} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        <div>
          <ChatterBox resourceType="master_services" resourceId={service.id} tenantId={service.tenant_id} containerClassName="h-[calc(100vh-22rem)]" />
        </div>
      </div>
    </div>
  );
}

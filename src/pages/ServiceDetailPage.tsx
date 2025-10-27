
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMasterServiceDetails, useUpdateMasterService } from '@/hooks/useServices';
import { useServiceCategories } from '@/hooks/useServiceCategories';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ServiceFormData = Partial<MasterService & { tax_type_ids: string[] }>;

export default function ServiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("info");

  const { data: service, isLoading: isLoadingService, error, refetch: refetchServiceDetails } = useMasterServiceDetails(id || '');
  const { data: serviceCategories, isLoading: isLoadingCategories } = useServiceCategories();
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
    // We reset the form only when both the service details and the service categories are loaded.
    // This ensures that the category dropdown is populated before its value is set, preventing race conditions.
    if (service && serviceCategories) {
      const tax_type_ids = existingTaxTypes?.map(st => st.tax_type_id) || [];
      form.reset({
        ...service,
        tax_type_ids,
      });
    }
  }, [service, existingTaxTypes, serviceCategories, form]);

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

  if (isLoadingService || isLoadingCategories) {
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
          <div className="md:hidden">
            <Select onValueChange={setActiveTab} value={activeTab}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar una sección..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="info">Información</SelectItem>
                <SelectItem value="prices">Precios</SelectItem>
                <SelectItem value="commissions">Comisiones</SelectItem>
                <SelectItem value="assignment">Asignación</SelectItem>
              </SelectContent>
            </Select>
            <div className="pt-4">
              {activeTab === 'info' && (
                <Card>
                  <CardHeader><CardTitle>Información General</CardTitle></CardHeader>
                  <CardContent>
                    <ServiceForm
                      form={form}
                      onSubmit={onSubmit}
                      isEdit={true}
                      isLoading={isUpdating}
                      serviceCategories={serviceCategories}
                      isLoadingCategories={isLoadingCategories}
                    />
                  </CardContent>
                </Card>
              )}
              {activeTab === 'prices' && (
                <Card>
                  <CardHeader><CardTitle>Precios por Sucursal</CardTitle></CardHeader>
                  <CardContent>
                    <ServicePricesTab service={service} />
                  </CardContent>
                </Card>
              )}
              {activeTab === 'commissions' && (
                <Card>
                  <CardHeader><CardTitle>Comisiones</CardTitle></CardHeader>
                  <CardContent>
                    <ServiceCommissionsTab serviceId={service.id} serviceName={service.name} />
                  </CardContent>
                </Card>
              )}
              {activeTab === 'assignment' && (
                <Card>
                  <CardHeader><CardTitle>Asignación a Sucursales</CardTitle></CardHeader>
                  <CardContent>
                    <ServiceAssignmentTab service={service} />
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
          <div className="hidden md:block">
            <Tabs defaultValue="info" onValueChange={setActiveTab} value={activeTab} className="w-full">
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
                      serviceCategories={serviceCategories}
                      isLoadingCategories={isLoadingCategories}
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
        </div>
        <div>
          <ChatterBox resourceType="services" resourceId={service.id} tenantId={service.tenant_id} containerClassName="h-[calc(100vh-22rem)]" />
        </div>
      </div>
    </div>
  );
}

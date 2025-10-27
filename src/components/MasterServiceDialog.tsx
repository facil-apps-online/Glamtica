import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useCreateMasterService, useUpdateMasterService } from "@/hooks/useServices";
import { useServiceTaxTypes, useAddServiceTaxType, useRemoveServiceTaxType } from "@/hooks/useServiceTaxTypes";
import { useServiceCategories } from "@/hooks/useServiceCategories";
import { MasterService } from "@/types/services";
import { useToast } from "@/hooks/use-toast";
import { ServiceForm } from "./ServiceForm";

// Define the shape of our form data, including the tax_type_ids array
type ServiceFormData = Partial<MasterService & { tax_type_ids: string[] }>;

interface MasterServiceDialogProps {
  service?: MasterService;
  trigger?: React.ReactNode;
  onOpenChange?: (open: boolean) => void;
}

export const MasterServiceDialog = ({ service, trigger, onOpenChange }: MasterServiceDialogProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    onOpenChange?.(isOpen);
  };

  const { mutate: createService, isPending: isCreating } = useCreateMasterService();
  const { mutate: updateService, isPending: isUpdating } = useUpdateMasterService();
  const { data: serviceCategories, isLoading: isLoadingCategories } = useServiceCategories();
  
  const { data: existingTaxTypes, refetch: refetchServiceTaxTypes } = useServiceTaxTypes(service?.id || '');
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
    if (open) {
      if (service) {
        const tax_type_ids = existingTaxTypes?.map(st => st.tax_type_id) || [];
        form.reset({
          ...service,
          tax_type_ids,
        });
      } else {
        form.reset({
          name: '',
          description: '',
          duration_minutes: 0,
          category_id: undefined,
          tax_type_ids: [],
        });
      }
    }
  }, [service, existingTaxTypes, open, form]);

  const handleTaxTypeUpdates = (serviceId: string, selectedTaxTypeIds: string[]) => {
    if (!serviceId) return;

    const currentTaxTypeIds = existingTaxTypes?.map(st => st.tax_type_id) || [];

    const taxTypesToAdd = selectedTaxTypeIds.filter(id => !currentTaxTypeIds.includes(id));
    taxTypesToAdd.forEach(taxTypeId => {
      addServiceTaxType({ service_id: serviceId, tax_type_id: taxTypeId });
    });

    const taxTypesToRemove = currentTaxTypeIds.filter(id => !selectedTaxTypeIds.includes(id));
    taxTypesToRemove.forEach(taxTypeId => {
      const serviceTaxType = existingTaxTypes?.find(st => st.tax_type_id === taxTypeId);
      if (serviceTaxType) {
        removeServiceTaxType({ id: serviceTaxType.id });
      }
    });
    refetchServiceTaxTypes();
  };

  const onSubmit = (data: ServiceFormData) => {
    const { tax_type_ids = [], ...serviceData } = data;

    const onMutateSuccess = (resultService: MasterService) => {
      handleTaxTypeUpdates(resultService.id, tax_type_ids);
      toast({ title: "Éxito", description: `Servicio ${service ? 'actualizado' : 'creado'} correctamente.`, variant: "success" });
      setOpen(false);
    };

    const onMutateError = (error: Error) => {
      toast({ title: "Error", description: `Error al ${service ? 'actualizar' : 'crear'} servicio: ${error.message}`, variant: "destructive" });
    };

    if (service) {
      updateService({ id: service.id, updates: serviceData }, {
        onSuccess: onMutateSuccess,
        onError: onMutateError,
      });
    } else {
      createService(serviceData, {
        onSuccess: onMutateSuccess,
        onError: onMutateError,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Servicio Maestro
          </Button>
        )}
      </DialogTrigger>
      <DialogContent onInteractOutside={(e) => { e.preventDefault(); e.stopPropagation(); handleOpenChange(false); }} className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{service ? "Editar Servicio Maestro" : "Nuevo Servicio Maestro"}</DialogTitle>
        </DialogHeader>
        <ServiceForm
          form={form}
          onSubmit={onSubmit}
          isEdit={!!service}
          isLoading={isCreating || isUpdating}
          onCancel={() => setOpen(false)}
          serviceCategories={serviceCategories}
          isLoadingCategories={isLoadingCategories}
        />
      </DialogContent>
    </Dialog>
  );
};
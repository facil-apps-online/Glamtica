import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit } from "lucide-react";
import { useCreateMasterService, useUpdateMasterService } from "@/hooks/useServices";
import { MasterService } from "@/types/services";
import { useServiceCategories } from "@/hooks/useServiceCategories";
import { useTaxTypes } from "@/hooks/useTaxTypes";
import { useServiceTaxTypes, useAddServiceTaxType, useRemoveServiceTaxType } from "@/hooks/useServiceTaxTypes";
import { useToast } from "@/hooks/use-toast";
import { MultiSelect } from "@/components/ui/MultiSelect";

interface MasterServiceDialogProps {
  service?: MasterService;
  trigger?: React.ReactNode;
}

export const MasterServiceDialog = ({ service, trigger }: MasterServiceDialogProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState<number | string>("");
  
  const [category_id, setCategory_id] = useState<string | undefined>(undefined);
  const [selectedTaxTypeIds, setSelectedTaxTypeIds] = useState<string[]>([]);

  const { mutate: createService, isPending: isCreating } = useCreateMasterService();
  const { mutate: updateService, isPending: isUpdating } = useUpdateMasterService();
  const { data: serviceCategories } = useServiceCategories();
  const { data: taxTypes } = useTaxTypes();
  const { data: serviceTaxTypes, refetch: refetchServiceTaxTypes } = useServiceTaxTypes(service?.id || '');
  const { mutate: addServiceTaxType } = useAddServiceTaxType();
  const { mutate: removeServiceTaxType } = useRemoveServiceTaxType();

  useEffect(() => {
    if (service) {
      setName(service.name || "");
      setDescription(service.description || "");
      setDurationMinutes(service.duration_minutes || "");
      
      setCategory_id(service.category_id || undefined);
      if (serviceTaxTypes) {
        setSelectedTaxTypeIds(serviceTaxTypes.map(st => st.tax_type_id));
      }
    } else {
      resetForm();
    }
  }, [service, serviceTaxTypes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      toast({ title: "Error", description: "El nombre del servicio es requerido.", variant: "destructive" });
      return;
    }

    const serviceData = {
      name,
      description: description || undefined,
      duration_minutes: Number(durationMinutes) || 0,
      
      category_id: category_id || undefined,
    };

    let serviceId: string | undefined;

    if (service) {
      updateService({ id: service.id, updates: serviceData }, {
        onSuccess: (updatedService) => {
          serviceId = updatedService.id;
          handleTaxTypeUpdates(serviceId);
          handleSuccess();
        },
        onError: (error) => {
          toast({ title: "Error", description: `Error al actualizar servicio: ${error.message}`, variant: "destructive" });
        }
      });
    } else {
      createService(serviceData, {
        onSuccess: (newService) => {
          serviceId = newService.id;
          handleTaxTypeUpdates(serviceId);
          handleSuccess();
        },
        onError: (error) => {
          toast({ title: "Error", description: `Error al crear servicio: ${error.message}`, variant: "destructive" });
        }
      });
    }
  };

  const handleTaxTypeUpdates = (currentServiceId: string) => {
    if (!currentServiceId) return;

    const currentTaxTypeIds = serviceTaxTypes?.map(st => st.tax_type_id) || [];

    const taxTypesToAdd = selectedTaxTypeIds.filter(id => !currentTaxTypeIds.includes(id));
    taxTypesToAdd.forEach(taxTypeId => {
      addServiceTaxType({ service_id: currentServiceId, tax_type_id: taxTypeId }, {
        onError: (error) => {
          toast({ title: "Error", description: `Error al añadir tipo de impuesto: ${error.message}`, variant: "destructive" });
        }
      });
    });

    const taxTypesToRemove = currentTaxTypeIds.filter(id => !selectedTaxTypeIds.includes(id));
    taxTypesToRemove.forEach(taxTypeId => {
      const serviceTaxType = serviceTaxTypes?.find(st => st.tax_type_id === taxTypeId);
      if (serviceTaxType) {
        removeServiceTaxType({ id: serviceTaxType.id }, {
          onError: (error) => {
            toast({ title: "Error", description: `Error al eliminar tipo de impuesto: ${error.message}`, variant: "destructive" });
          }
        });
      }
    });
    refetchServiceTaxTypes();
  };

  const handleSuccess = () => {
    setOpen(false);
    resetForm();
    toast({ title: "Éxito", description: `Servicio ${service ? 'actualizado' : 'creado'} correctamente.`, variant: "success" });
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setDurationMinutes("");
    
    setCategory_id(undefined);
    setSelectedTaxTypeIds([]);
  };

  const taxTypeOptions = useMemo(() => {
    return taxTypes?.map(tt => ({ value: tt.id, label: tt.name })) || [];
  }, [taxTypes]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Servicio Maestro
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{service ? "Editar Servicio Maestro" : "Nuevo Servicio Maestro"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre del Servicio</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Categoría</Label>
              <Select value={category_id} onValueChange={setCategory_id}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {serviceCategories?.map((cat) => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration_minutes">Duración (minutos)</Label>
              <Input id="duration_minutes" type="number" value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="taxTypes">Tipos de Impuesto</Label>
            <MultiSelect
              options={taxTypeOptions}
              selected={selectedTaxTypeIds}
              onSelectedChange={setSelectedTaxTypeIds}
              placeholder="Seleccionar tipos de impuesto"
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={isCreating || isUpdating}>
              {service ? "Actualizar" : "Crear"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

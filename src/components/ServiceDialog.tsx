
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit } from "lucide-react";
import { useCreateService, useUpdateService } from "@/hooks/useServices";
import { useActiveServiceCategories } from "@/hooks/useServiceCategories";
import { ServiceCategoryDialog } from "@/components/ServiceCategoryDialog";
import { usePriceFormat } from "@/hooks/usePriceFormat";
import { useSettings } from "@/hooks/useSettings";

interface Service {
  id?: string;
  name: string;
  description?: string;
  price: number;
  duration_minutes: number;
  category_id?: string;
  is_active?: boolean;
}

interface ServiceDialogProps {
  service?: Service;
  trigger?: React.ReactNode;
}

export const ServiceDialog = ({ service, trigger }: ServiceDialogProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(service?.name || "");
  const [description, setDescription] = useState(service?.description || "");
  const [price, setPrice] = useState(service?.price || 0);
  const [durationMinutes, setDurationMinutes] = useState(service?.duration_minutes || 30);
  const [categoryId, setCategoryId] = useState(service?.category_id || "");

  const createMutation = useCreateService();
  const updateMutation = useUpdateService();
  const { data: categories } = useActiveServiceCategories();
  const { data: settings } = useSettings();

  // Obtener símbolo de moneda de configuración
  const currencySymbol = settings?.find(s => s.key === 'currency')?.value || 'EUR';
  const displaySymbol = currencySymbol === 'EUR' ? '€' : 
                       currencySymbol === 'USD' ? '$' : 
                       currencySymbol === 'GBP' ? '£' : currencySymbol;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || price <= 0 || durationMinutes <= 0) {
      return;
    }

    const serviceData = {
      name,
      description: description || undefined,
      price,
      duration_minutes: durationMinutes,
      category_id: categoryId || undefined,
      is_active: true,
    };

    try {
      if (service) {
        await updateMutation.mutateAsync({
          id: service.id!,
          updates: serviceData,
        });
      } else {
        await createMutation.mutateAsync(serviceData);
      }
      setOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving service:', error);
    }
  };

  const resetForm = () => {
    if (!service) {
      setName("");
      setDescription("");
      setPrice(0);
      setDurationMinutes(30);
      setCategoryId("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Servicio
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-primary">
            {service ? "Editar Servicio" : "Nuevo Servicio"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre del Servicio</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Corte Femenino"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoría</Label>
            <div className="flex gap-2">
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <ServiceCategoryDialog />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción del servicio..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Precio ({displaySymbol})</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duración (minutos)</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 30)}
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {service ? "Actualizar" : "Crear"} Servicio
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

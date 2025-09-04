import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { EquipmentBrand, useEquipmentBrands } from '@/hooks/useEquipmentBrands';
import { Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  is_active: z.boolean().default(true),
});

interface EquipmentBrandDialogProps {
  brand?: EquipmentBrand | null;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export const EquipmentBrandDialog: React.FC<EquipmentBrandDialogProps> = ({ brand, trigger, onSuccess }) => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      is_active: true,
    }
  });

  const { addBrand, updateBrand, loading: isMutating } = useEquipmentBrands();

  useEffect(() => {
    if (open) {
      if (brand) {
        reset({
          name: brand.name,
          description: brand.description || '',
          is_active: brand.is_active,
        });
      } else {
        reset({
          name: '',
          description: '',
          is_active: true,
        });
      }
    }
  }, [brand, open, reset]);

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      if (brand) {
        await updateBrand({ id: brand.id, updates: data });
        toast({ title: "Éxito", description: "Marca de equipo actualizada correctamente.", variant: "success" });
      } else {
        await addBrand(data);
        toast({ title: "Éxito", description: "Marca de equipo creada correctamente.", variant: "success" });
      }
      setOpen(false);
      onSuccess?.();
    } catch (error: any) {
      toast({ title: "Error", description: `Error: ${error.message}`, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Añadir Marca
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {brand ? "Editar Marca de Equipo" : "Nueva Marca de Equipo"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre de la Marca</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Ej: L'Oréal"
            />
            {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción (Opcional)</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Descripción de la marca..."
            />
          </div>

          <div className="flex items-center space-x-2">
            <Controller
              name="is_active"
              control={control}
              render={({ field }) => (
                <Switch
                  id="is_active"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="is_active">Activo</Label>
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
              disabled={isMutating}
            >
              {isMutating ? 'Guardando...' : (brand ? "Actualizar" : "Crear")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

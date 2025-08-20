import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useEquipmentTypes, EquipmentType } from '@/hooks/useEquipmentTypes';

const formSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),
  is_active: z.boolean().default(true),
});

interface EquipmentTypeManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: EquipmentType | null;
  isQuickAddMode?: boolean;
  onSuccess?: () => void;
}

export const EquipmentTypeManagementDialog: React.FC<EquipmentTypeManagementDialogProps> = ({ open, onOpenChange, type, onSuccess }) => {
  const { addType, updateType } = useEquipmentTypes();
  const { control, register, handleSubmit, reset, formState: { errors } } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    if (type) {
      reset({
        name: type.name,
        description: type.description || '',
        is_active: type.is_active,
      });
    } else {
      reset({
        name: '',
        description: '',
        is_active: true,
      });
    }
  }, [type, reset]);

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (type) {
      await updateType(type.id, data);
    } else {
      await addType({ name: data.name, description: data.description });
    }
    onSuccess?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{type ? 'Editar Tipo de Equipo' : 'Añadir Nuevo Tipo de Equipo'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" {...register('name')} />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <Label htmlFor="description">Descripción</Label>
            <Textarea id="description" {...register('description')} />
          </div>
          <div className="flex items-center space-x-2">
            <Controller
              control={control}
              name="is_active"
              render={({ field }) => (
                <Checkbox
                  id="is_active"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="is_active">Activo</Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">{type ? 'Actualizar' : 'Crear'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
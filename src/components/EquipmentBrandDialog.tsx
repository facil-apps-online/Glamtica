import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useEquipmentBrands, EquipmentBrand } from '@/hooks/useEquipmentBrands';

const formSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  is_active: z.boolean(),
});

interface EquipmentBrandDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brand: EquipmentBrand | null;
}

export const EquipmentBrandDialog: React.FC<EquipmentBrandDialogProps> = ({ open, onOpenChange, brand }) => {
  const { addBrand, updateBrand } = useEquipmentBrands();
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
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
  }, [brand, reset]);

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (brand) {
      await updateBrand(brand.id, data);
    } else {
      await addBrand(data);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{brand ? 'Editar Marca de Equipo' : 'Añadir Nueva Marca de Equipo'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" {...register('name')} />
            {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
          </div>
          <div>
            <Label htmlFor="description">Descripción</Label>
            <Textarea id="description" {...register('description')} />
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
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">{brand ? 'Guardar Cambios' : 'Crear Marca'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
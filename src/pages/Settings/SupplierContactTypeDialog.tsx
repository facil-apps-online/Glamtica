import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateSupplierContactType, useUpdateSupplierContactType, SupplierContactType } from '@/hooks/useSupplierContactTypes';
import { useToast } from '@/hooks/use-toast';

interface SupplierContactTypeDialogProps {
  children: React.ReactNode;
  contactType?: SupplierContactType;
  isEdit?: boolean;
}

export const SupplierContactTypeDialog: React.FC<SupplierContactTypeDialogProps> = ({ children, contactType, isEdit = false }) => {
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();
  const createMutation = useCreateSupplierContactType();
  const updateMutation = useUpdateSupplierContactType();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<SupplierContactType>({
    defaultValues: isEdit && contactType ? contactType : { name: '' },
  });

  useEffect(() => {
    if (open) {
      reset(isEdit && contactType ? contactType : { name: '' });
    }
  }, [open, contactType, isEdit, reset]);

  const onSubmit = (data: SupplierContactType) => {
    const mutation = isEdit ? updateMutation : createMutation;
    const action = isEdit ? 'actualizar' : 'crear';

    mutation.mutate(data as any, {
      onSuccess: () => {
        toast({ title: 'Éxito', description: `Tipo de contacto ${action}do correctamente.` });
        setOpen(false);
      },
      onError: (error) => {
        toast({ title: 'Error', description: `No se pudo ${action} el tipo de contacto: ${error.message}` });
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar' : 'Crear'} Tipo de Contacto</DialogTitle>
          <DialogDescription>
            Define un tipo de contacto para los proveedores.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" {...register('name', { required: 'El nombre es obligatorio' })} />
            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {isEdit ? 'Guardar Cambios' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};


import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
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
import { Checkbox } from '@/components/ui/checkbox';
import { useCreateContactType, useUpdateContactType, ContactType } from '@/hooks/useContactTypes'; // Estos hooks se crearán más adelante
import { useToast } from '@/hooks/use-toast';

interface ContactTypeDialogProps {
  children: React.ReactNode;
  contactType?: ContactType;
  isEdit?: boolean;
}

export const ContactTypeManagementDialog: React.FC<ContactTypeDialogProps> = ({ children, contactType, isEdit = false }) => {
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();
  const createMutation = useCreateContactType();
  const updateMutation = useUpdateContactType();

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<ContactType>({
    defaultValues: isEdit && contactType ? contactType : { name: '', is_for_supplier: false, is_for_client: false },
  });

  useEffect(() => {
    if (open) {
      reset(isEdit && contactType ? contactType : { name: '', is_for_supplier: false, is_for_client: false });
    }
  }, [open, contactType, isEdit, reset]);

  const onSubmit = (data: ContactType) => {
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
            Define un tipo de contacto y a qué entidades aplica (clientes o proveedores).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" {...register('name', { required: 'El nombre es obligatorio' })} />
            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
          </div>
          
          <div className="space-y-2">
            <Label>Aplica a</Label>
            <div className="flex items-center space-x-4">
                <Controller
                    name="is_for_client"
                    control={control}
                    render={({ field }) => (
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="is_for_client"
                                checked={field.value}
                                onCheckedChange={field.onChange}
                            />
                            <Label htmlFor="is_for_client">Clientes</Label>
                        </div>
                    )}
                />
                <Controller
                    name="is_for_supplier"
                    control={control}
                    render={({ field }) => (
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="is_for_supplier"
                                checked={field.value}
                                onCheckedChange={field.onChange}
                            />
                            <Label htmlFor="is_for_supplier">Proveedores</Label>
                        </div>
                    )}
                />
            </div>
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

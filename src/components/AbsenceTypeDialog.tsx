
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
import { Textarea } from '@/components/ui/textarea';
import { useCreateAbsenceType, useUpdateAbsenceType, AbsenceType } from '@/hooks/useAbsenceTypes';
import { useToast } from '@/hooks/use-toast';

interface AbsenceTypeDialogProps {
  children: React.ReactNode;
  absenceType?: AbsenceType;
  isEdit?: boolean;
}

export const AbsenceTypeDialog: React.FC<AbsenceTypeDialogProps> = ({ children, absenceType, isEdit = false }) => {
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();
  const createMutation = useCreateAbsenceType();
  const updateMutation = useUpdateAbsenceType();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<Omit<AbsenceType, 'id' | 'is_active'>>({
    defaultValues: isEdit && absenceType ? { name: absenceType.name, description: absenceType.description } : { name: '', description: '' },
  });

  useEffect(() => {
    if (open) {
      reset(isEdit && absenceType ? { name: absenceType.name, description: absenceType.description } : { name: '', description: '' });
    }
  }, [open, absenceType, isEdit, reset]);

  const onSubmit = (data: Omit<AbsenceType, 'id' | 'is_active'>) => {
    const mutation = isEdit ? updateMutation : createMutation;
    const action = isEdit ? 'actualizar' : 'crear';

    const mutationData = isEdit ? { ...data, id: absenceType!.id } : data;

    mutation.mutate(mutationData as any, {
      onSuccess: () => {
        toast({ title: 'Éxito', description: `Tipo de ausencia ${action}do correctamente.` });
        setOpen(false);
      },
      onError: (error) => {
        toast({ title: 'Error', description: `No se pudo ${action} el tipo de ausencia: ${error.message}` });
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar' : 'Crear'} Tipo de Ausencia</DialogTitle>
          <DialogDescription>
            Define un tipo de ausencia para que los empleados puedan solicitar tiempo libre.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" {...register('name', { required: 'El nombre es obligatorio' })} />
            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea id="description" {...register('description')} />
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

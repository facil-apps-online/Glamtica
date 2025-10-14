
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
import { useCreateDocumentType, useUpdateDocumentType, DocumentType } from '@/hooks/useDocumentTypes';
import { useToast } from '@/hooks/use-toast';

interface DocumentTypeDialogProps {
  children: React.ReactNode;
  documentType?: DocumentType;
  isEdit?: boolean;
}

const appliesToOptions = [
  { id: 'client', label: 'Clientes' },
  { id: 'supplier', label: 'Proveedores' },
  // { id: 'user', label: 'Usuarios' }, // Future option
];

export const DocumentTypeDialog: React.FC<DocumentTypeDialogProps> = ({ children, documentType, isEdit = false }) => {
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();
  const createMutation = useCreateDocumentType();
  const updateMutation = useUpdateDocumentType();

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<DocumentType>({
    defaultValues: isEdit && documentType ? documentType : { name: '', abbreviation: '', applies_to: ['client'] },
  });

  useEffect(() => {
    if (open) {
      reset(isEdit && documentType ? documentType : { name: '', abbreviation: '', applies_to: ['client'] });
    }
  }, [open, documentType, isEdit, reset]);

  const onSubmit = (data: DocumentType) => {
    const mutation = isEdit ? updateMutation : createMutation;
    const action = isEdit ? 'actualizar' : 'crear';

    mutation.mutate(data as any, {
      onSuccess: () => {
        toast({ title: 'Éxito', description: `Tipo de documento ${action}do correctamente.` });
        setOpen(false);
      },
      onError: (error) => {
        toast({ title: 'Error', description: `No se pudo ${action} el tipo de documento: ${error.message}` });
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar' : 'Crear'} Tipo de Documento</DialogTitle>
          <DialogDescription>
            Define un tipo de documento y a qué entidades se aplica.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" {...register('name', { required: 'El nombre es obligatorio' })} />
            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="abbreviation">Abreviatura</Label>
            <Input id="abbreviation" {...register('abbreviation')} />
          </div>
          <div className="space-y-2">
            <Label>Aplica a</Label>
            <Controller
              name="applies_to"
              control={control}
              render={({ field }) => (
                <div className="space-y-2">
                  {appliesToOptions.map(option => (
                    <div key={option.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={option.id}
                        checked={field.value.includes(option.id)}
                        onCheckedChange={(checked) => {
                          const newValue = checked
                            ? [...field.value, option.id]
                            : field.value.filter(id => id !== option.id);
                          field.onChange(newValue);
                        }}
                      />
                      <Label htmlFor={option.id}>{option.label}</Label>
                    </div>
                  ))}
                </div>
              )}
            />
            {errors.applies_to && <p className="text-sm text-red-500">{errors.applies_to.message}</p>}
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

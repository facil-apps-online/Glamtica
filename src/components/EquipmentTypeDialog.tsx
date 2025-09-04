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
import { useEquipmentTypes, EquipmentType } from '@/hooks/useEquipmentTypes';
import { Plus, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),
  is_active: z.boolean().default(true),
});

interface EquipmentTypeDialogProps {
  type?: EquipmentType | null;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export const EquipmentTypeDialog: React.FC<EquipmentTypeDialogProps> = ({ type, trigger, onSuccess }) => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { control, register, handleSubmit, reset, formState: { errors } } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      is_active: true,
    }
  });

  const { addType, updateType, loading: isMutating } = useEquipmentTypes();

  useEffect(() => {
    if (open) {
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
    }
  }, [type, open, reset]);

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      if (type) {
        await updateType({ id: type.id, updates: data });
        toast({ title: "Éxito", description: "Tipo de equipo actualizado correctamente.", variant: "success" });
      } else {
        await addType({ name: data.name, description: data.description, is_active: data.is_active });
        toast({ title: "Éxito", description: "Tipo de equipo creado correctamente.", variant: "success" });
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
            Añadir Tipo
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {type ? "Editar Tipo de Equipo" : "Nuevo Tipo de Equipo"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre del Tipo</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Ej: Herramientas"
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción (Opcional)</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Descripción del tipo de equipo..."
            />
          </div>

          <div className="flex items-center space-x-2">
            <Controller
              control={control}
              name="is_active"
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
              {isMutating ? 'Guardando...' : (type ? "Actualizar" : "Crear")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

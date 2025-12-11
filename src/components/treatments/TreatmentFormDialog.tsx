import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from "@/components/ui/textarea";
import { useToast } from '@/hooks/use-toast';
import { useCreateTreatment, useUpdateTreatment, Treatment } from '@/hooks/useTreatments';
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const formSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres."),
  description: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface TreatmentFormDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccess: () => void;
  treatment?: Treatment;
}

export const TreatmentFormDialog = ({ isOpen, onOpenChange, onSuccess, treatment }: TreatmentFormDialogProps) => {
  const { toast } = useToast();
  const isEditMode = !!treatment;

  const { mutate: createTreatment, isPending: isCreating } = useCreateTreatment();
  const { mutate: updateTreatment, isPending: isUpdating } = useUpdateTreatment();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  useEffect(() => {
    if (isEditMode) {
      form.reset({
        name: treatment.name,
        description: treatment.description || "",
      });
    } else {
      form.reset({
        name: "",
        description: "",
      });
    }
  }, [treatment, isEditMode, form]);

  const onSubmit = (data: FormData) => {
    const mutationOptions = {
      onSuccess: () => {
        toast({ title: "Éxito", description: `Tratamiento ${isEditMode ? 'actualizado' : 'creado'} correctamente.`, variant: "success" });
        onSuccess();
      },
      onError: (error: any) => {
        toast({ title: "Error", description: `No se pudo ${isEditMode ? 'actualizar' : 'crear'} el tratamiento: ${error.message}`, variant: "destructive" });
      },
    };

    if (isEditMode) {
      updateTreatment({ id: treatment.id, updates: data }, mutationOptions);
    } else {
      createTreatment({ ...data, type: 'treatment' }, mutationOptions);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edición Rápida" : "Crear Nuevo"} Tratamiento</DialogTitle>
          <DialogDescription>
            {isEditMode ? "Modifica los detalles básicos de tu tratamiento." : "Añade un nuevo tratamiento. Podrás configurar los precios y sesiones en la edición completa."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Tratamiento</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Tratamiento Facial Básico" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Breve descripción del tratamiento" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Cancelar
                </Button>
                <Button type="submit" disabled={isCreating || isUpdating}>
                    {isCreating || isUpdating ? "Guardando..." : "Guardar Cambios"}
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

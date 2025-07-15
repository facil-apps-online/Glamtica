import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Localization, useCreateLocalization, useUpdateLocalization } from '@/hooks/useLocalization';

const formSchema = z.object({
  name: z.string().min(1, "El nombre es requerido."),
  iso_code: z.string().min(2, "El código debe tener entre 2 y 10 caracteres.").max(10),
});

interface LocalizationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  localization?: Localization;
}

export function LocalizationDialog({ isOpen, onClose, localization }: LocalizationDialogProps) {
  const createMutation = useCreateLocalization();
  const updateMutation = useUpdateLocalization();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: localization || { name: '', iso_code: '' },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (localization) {
        await updateMutation.mutateAsync({ ...values, id: localization.id });
      } else {
        await createMutation.mutateAsync(values);
      }
      form.reset();
      onClose();
    } catch (error) {
      // El hook ya muestra un toast de error
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{localization ? 'Editar Localización' : 'Crear Nueva Localización'}</DialogTitle>
          <DialogDescription>
            Define un idioma y su código de localización (ej. es-CO, en-US).
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl><Input placeholder="Ej: Español (Colombia)" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="iso_code" render={({ field }) => (
              <FormItem>
                <FormLabel>Código de Localización</FormLabel>
                <FormControl><Input placeholder="Ej: es-CO" {...field} maxLength={10} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending ? 'Guardando...' : 'Guardar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useGlobalSettings, useUpdateGlobalSettings } from '@/hooks/useGlobalSettings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';

const settingsSchema = z.object({
  company_name: z.string().min(1, 'El nombre de la empresa es requerido.'),
  contact_email: z.string().email('Debe ser un correo electrónico válido.'),
  address: z.string().optional(),
  trial_duration_days: z.coerce.number().int().min(1, 'La duración debe ser al menos 1 día.'),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export function GeneralSettingsTab() {
  const { data: settings, isLoading } = useGlobalSettings();
  const { mutate: updateSettings, isPending: isUpdating } = useUpdateGlobalSettings();
  const { toast } = useToast();

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      company_name: '',
      contact_email: '',
      address: '',
      trial_duration_days: 14,
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        company_name: settings.company_name || '',
        contact_email: settings.contact_email || '',
        address: settings.address || '',
        trial_duration_days: settings.trial_duration_days || 14,
      });
    }
  }, [settings, form]);

  const onSubmit = (values: SettingsFormValues) => {
    updateSettings(values, {
      onSuccess: () => {
        toast({ title: 'Éxito', description: 'Configuración guardada correctamente.', variant: 'success' });
      },
      onError: (error) => {
        toast({ title: 'Error', description: `No se pudo guardar: ${error.message}`, variant: 'destructive' });
      },
    });
  };

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Información de la Empresa y Pruebas</CardTitle>
        <CardDescription>Gestiona los datos de tu empresa y la duración del período de prueba para nuevos clientes.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="company_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de la Empresa</FormLabel>
                    <FormControl><Input placeholder="Ej: Glamtica S.A.S" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contact_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email de Contacto</FormLabel>
                    <FormControl><Input placeholder="contacto@glamtica.app" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Dirección</FormLabel>
                    <FormControl><Input placeholder="Calle 123, Ciudad" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="trial_duration_days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Días del Período de Prueba</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
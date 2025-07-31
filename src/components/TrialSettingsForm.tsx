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

const trialSchema = z.object({
  trial_duration_days: z.coerce.number().int().min(1, 'La duración debe ser al menos 1 día.'),
});

type TrialFormValues = z.infer<typeof trialSchema>;

export function TrialSettingsForm() {
  const { data: settings, isLoading } = useGlobalSettings();
  const { mutate: updateSettings, isPending: isUpdating } = useUpdateGlobalSettings();
  const { toast } = useToast();

  const form = useForm<TrialFormValues>({
    resolver: zodResolver(trialSchema),
    defaultValues: {
      trial_duration_days: 14,
    },
  });

  useEffect(() => {
    if (settings && settings.trial_duration_days) {
      form.reset({
        trial_duration_days: settings.trial_duration_days,
      });
    }
  }, [settings, form]);

  const onSubmit = (values: TrialFormValues) => {
    updateSettings(values, {
      onSuccess: () => {
        toast({ title: 'Éxito', description: 'Configuración del período de prueba guardada.', variant: 'success' });
      },
      onError: (error) => {
        toast({ title: 'Error', description: `No se pudo guardar: ${error.message}`, variant: 'destructive' });
      },
    });
  };

  if (isLoading) {
    return <Skeleton className="h-48 w-full" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Período de Prueba</CardTitle>
        <CardDescription>
          Define la cantidad de días que los nuevos tenants tendrán para probar el servicio antes de requerir una suscripción.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="trial_duration_days"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duración del Período de Prueba (en días)</FormLabel>
                  <FormControl><Input type="number" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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

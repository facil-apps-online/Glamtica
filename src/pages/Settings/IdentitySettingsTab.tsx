import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTenantSettings, useUpdateTenantSettings } from '@/hooks/useTenantSettings';
import { Button } from '@/components/ui/button';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { LogoUploader } from '@/components/LogoUploader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';

const identitySchema = z.object({
  logo_url: z.string().optional(),
});

type IdentityFormValues = z.infer<typeof identitySchema>;

export function IdentitySettingsTab() {
  const { data: settings, isLoading } = useTenantSettings();
  const { mutate: updateSettings, isPending: isUpdating } = useUpdateTenantSettings();
  const { toast } = useToast();
  const { refreshUser } = useAuth();

  const form = useForm<IdentityFormValues>({
    resolver: zodResolver(identitySchema),
    defaultValues: {
      logo_url: '',
    },
  });

  useEffect(() => {
    console.log('IdentitySettingsTab: useEffect - settings changed', settings);
    if (settings) {
      form.reset({
        logo_url: settings.logo_url || '',
      });
    }
  }, [settings, form]);

  const onSubmit = (values: IdentityFormValues) => {
    console.log('IdentitySettingsTab: onSubmit - values', values);
    updateSettings(values, {
      onSuccess: () => {
        toast({ title: 'Éxito', description: 'Configuración de identidad guardada correctamente.', variant: 'success' });
        console.log('IdentitySettingsTab: onSubmit - onSuccess');
        refreshUser();
      },
      onError: (error) => {
        toast({ title: 'Error', description: `No se pudo guardar la configuración de identidad: ${error.message}`, variant: 'destructive' });
        console.error('IdentitySettingsTab: onSubmit - onError', error);
      },
    });
  };

  console.log('IdentitySettingsTab: Render - settings:', settings, 'isLoading:', isLoading);

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Identidad Visual</CardTitle>
        <CardDescription>
          Gestiona el logo de tu marca. Este logo aparecerá en diferentes partes de la aplicación.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="logo_url"
              render={({ field }) => {
                console.log('LogoUploader: field.value:', field.value);
                return (
                  <FormItem>
                    <FormLabel>Logo de la Empresa</FormLabel>
                    <FormControl>
                      <LogoUploader 
                        initialLogoUrl={field.value}
                        onUploadSuccess={(newFileId) => {
                          console.log('LogoUploader: onUploadSuccess - newFileId:', newFileId);
                          form.setValue('logo_url', newFileId, { shouldDirty: true, shouldValidate: true });
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <div className="flex justify-end">
              <Button type="submit" disabled={isUpdating || !form.formState.isDirty}>
                {isUpdating ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
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
import { Palette } from 'lucide-react';

const identitySchema = z.object({
  logo_url: z.string().optional(),
});

type IdentityFormValues = z.infer<typeof identitySchema>;

const IdentitySkeleton = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-7 w-1/3" />
      <Skeleton className="h-4 w-2/3 mt-1" />
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-32 w-32 rounded-full" />
      </div>
      <div className="flex justify-end mt-8">
        <Skeleton className="h-9 w-28" />
      </div>
    </CardContent>
  </Card>
);

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
    if (settings) {
      form.reset({
        logo_url: settings.logo_url || '',
      });
    }
  }, [settings, form]);

  const onSubmit = (values: IdentityFormValues) => {
    updateSettings(values, {
      onSuccess: () => {
        toast({ title: 'Éxito', description: 'Configuración de identidad guardada correctamente.', variant: 'success' });
        refreshUser();
      },
      onError: (error) => {
        toast({ title: 'Error', description: `No se pudo guardar la configuración de identidad: ${error.message}`, variant: 'destructive' });
      },
    });
  };

  if (isLoading) {
    return <IdentitySkeleton />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Palette className="h-5 w-5" />
          Identidad Visual
        </CardTitle>
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
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Logo de la Empresa</FormLabel>
                  <FormControl>
                    <LogoUploader 
                      initialLogoUrl={field.value}
                      onUploadSuccess={(newFileId) => {
                        form.setValue('logo_url', newFileId, { shouldDirty: true, shouldValidate: true });
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
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

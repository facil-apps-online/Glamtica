import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient'; // Importar supabase
import { AvatarUploader } from '@/components/AvatarUploader';

const profileFormSchema = z.object({
  first_name: z.string().min(1, "El nombre es requerido."),
  last_name: z.string().min(1, "El apellido es requerido."),
});

export const PersonalInfoTab = () => {
  const { user, profile, loading, refreshUser } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false); // Estado de carga local

  const form = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: { first_name: '', last_name: '' },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        first_name: profile.firstName || '',
        last_name: profile.lastName || '',
      });
    }
  }, [profile, form.reset]);

  // Lógica de guardado movida directamente aquí
  const onProfileSubmit = async (values: z.infer<typeof profileFormSchema>) => {
    if (!user) return;
    
    const payload = {
      ...values,
      avatar_url: profile?.avatarUrl,
    };

    setIsSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('user-actions', {
        body: {
          action: 'update-user-settings',
          payload: { userId: user.id, metadata: payload },
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.message);

      toast({ title: 'Éxito', description: 'Perfil actualizado.', variant: 'success' });
      await refreshUser();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 mt-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-primary">Información de Perfil</CardTitle>
          <CardDescription>Actualiza tu nombre y foto de perfil.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onProfileSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="md:col-span-1 flex flex-col items-center md:items-center space-y-4">
                  <FormLabel>Avatar</FormLabel>
                  {!loading && profile && (
                    <AvatarUploader size="lg" initialAvatarUrl={profile.avatarUrl} />
                  )}
                </div>
                <div className="md:col-span-2 space-y-4">
                  <FormField
                    control={form.control}
                    name="first_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="last_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Apellido</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  disabled={isSaving || !form.formState.isDirty}
                >
                  {isSaving ? 'Guardando...' : 'Guardar Perfil'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};
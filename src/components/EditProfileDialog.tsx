
import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { SchedulableUser } from "@/hooks/useSchedulableUsers";
import { invokeTenantAction } from '@/hooks/useTenantUsers';
import { useQueryClient } from '@tanstack/react-query';
import { AvatarUploader } from './AvatarUploader';
import { Edit } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';

const profileFormSchema = z.object({
  first_name: z.string().min(1, "El nombre es requerido."),
  last_name: z.string().min(1, "El apellido es requerido."),
  avatar_url: z.string().optional(),
});

interface EditProfileDialogProps {
  user: SchedulableUser;
  trigger: React.ReactNode;
}

interface IFormInput {
  first_name: string;
  last_name: string;
  avatar_url?: string;
}

export const EditProfileDialog: React.FC<EditProfileDialogProps> = ({ user, trigger }) => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { refreshUser } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      avatar_url: user.avatar_url || '',
    }
  });

  useEffect(() => {
    if (open) {
      form.reset({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        avatar_url: user.avatar_url || '',
      });
    }
  }, [open, user, form.reset]);

  const onSubmit = async (values: z.infer<typeof profileFormSchema>) => {
    setIsSaving(true);
    try {
      const payload = {
        userId: user.id,
        metadata: {
          first_name: values.first_name,
          last_name: values.last_name,
          avatar_url: values.avatar_url,
        },
      };

      const { data, error } = await supabase.functions.invoke('user-actions', {
        body: { action: 'update-user-settings', payload },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.message);

      toast({
        title: "Perfil actualizado",
        description: "La información del perfil ha sido actualizada.",
      });
      queryClient.invalidateQueries({ queryKey: ['schedulableUsers'] });
      refreshUser();
      setOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="py-4 overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Perfil</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="md:col-span-1 flex flex-col items-center md:items-center space-y-4">
                <FormLabel>Avatar</FormLabel>
                <div className="mb-4">
                  <Controller
                    name="avatar_url"
                    control={form.control}
                    render={({ field }) => (
                      <AvatarUploader
                        size="lg"
                        initialAvatarUrl={field.value}
                        onUpload={(url) => field.onChange(url)}
                      />
                    )}
                  />
                </div>
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
                      <FormLabel>Apellidos</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving || !form.formState.isDirty}>
                {isSaving ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

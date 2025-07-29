import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { useNavigate } from 'react-router-dom';

const formSchema = z.object({
  tenantName: z.string().min(3, {
    message: 'El nombre del tenant debe tener al menos 3 caracteres.',
  }),
  email: z.string().email({
    message: 'Por favor, introduce un email válido.',
  }),
});

export default function SetupSuperadmin() {
  const navigate = useNavigate();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tenantName: '',
      email: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const { tenantName, email } = values;

      // Llamada a la nueva Edge Function
      const { data, error } = await supabase.functions.invoke('create-superadmin-tenant', {
        body: { tenantName, adminEmail: email },
      });

      if (error) throw error;

      // Las Edge Functions devuelven el error en la propiedad 'message' de su respuesta
      if (data && !data.success) {
        throw new Error(data.message || 'Ocurrió un error desconocido en la función.');
      }
      
      toast({
        title: '¡Sistema Configurado!',
        description: 'El tenant y el superadministrador han sido creados. Se ha enviado un correo de invitación para establecer la contraseña.',
      });
      navigate('/auth');

    } catch (error: any) {
      console.error('Error al invocar la Edge Function:', error);
      toast({
        title: 'Error',
        description: error.message || 'Hubo un error al procesar la solicitud.',
        variant: 'destructive',
      });
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center">Configuración Inicial del Sistema</h2>
        <p className="text-sm text-center text-gray-600">
          Define el nombre de tu primer tenant y crea el usuario superadministrador.
        </p>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="tenantName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Tenant</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Glamtica Principal" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email del Superadministrador</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="admin@ejemplo.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Creando Sistema...' : 'Crear Sistema'}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}

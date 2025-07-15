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
  email: z.string().email({
    message: 'Por favor, introduce un email válido.',
  }),
  password: z.string().min(6, {
    message: 'La contraseña debe tener al menos 6 caracteres.',
  }),
  confirmPassword: z.string().min(6, {
    message: 'La confirmación de contraseña debe tener al menos 6 caracteres.',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden.',
  path: ['confirmPassword'],
});

export default function SetupSuperadmin() {
  const navigate = useNavigate();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const { email, password } = values;

      const { data, error } = await supabase.rpc('create_application_superadmin', {
        admin_email: email,
        admin_password: password,
      });

      if (error) {
        console.error('Error al crear superadministrador:', error);
        toast({
          title: 'Error',
          description: `Hubo un error al crear el superadministrador: ${error.message}`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Superadministrador Creado',
          description: 'El superadministrador se ha creado exitosamente.',
        });
        navigate('/auth'); // Redirigir a la página de autenticación
      }

    } catch (error) {
      toast({
        title: 'Error',
        description: 'Hubo un error al procesar la solicitud.',
        variant: 'destructive',
      });
      console.error(error);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center">Configurar Superadministrador</h2>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="********" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmar Contraseña</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="********" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">Crear Superadministrador</Button>
          </form>
        </Form>
      </div>
    </div>
  );
}

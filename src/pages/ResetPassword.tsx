import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import Logo from '@/assets/images/glamtica.app.png';
import { CheckCircle, XCircle } from 'lucide-react';

const formSchema = z.object({
  password: z.string().min(8, { message: 'La contraseña debe tener al menos 8 caracteres.' }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden.",
  path: ["confirmPassword"],
});

const PasswordRequirement = ({ isValid, text }: { isValid: boolean; text: string }) => (
  <div className={`flex items-center text-sm ${isValid ? 'text-green-600' : 'text-muted-foreground'}`}>
    {isValid ? <CheckCircle className="w-4 h-4 mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}
    {text}
  </div>
);

const ResetPasswordPage: React.FC = () => {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { password: '', confirmPassword: '' },
    mode: 'onChange',
  });

  const password = form.watch('password');

  const passwordChecks = {
    length: (password || '').length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    specialChar: /[!@#$%^&*]/.test(password),
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    } else {
      setError("Token no encontrado o inválido en la URL.");
    }
  }, [location]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: rpcError } = await supabase.rpc('update_password_with_token', {
        p_token: token,
        p_new_password: values.password,
      });

      if (rpcError) throw rpcError;
      if (!data.success) throw new Error(data.message || 'Ocurrió un error al actualizar la contraseña.');

      toast({
        title: 'Éxito',
        description: 'Tu contraseña ha sido actualizada. Ahora puedes iniciar sesión.',
        variant: 'success',
      });
      navigate('/auth');

    } catch (err: any) {
      setError(err.message);
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-brand-primary lg:grid lg:grid-cols-2">
      {/* Columna Izquierda - Panel de Bienvenida */}
      <div className="hidden lg:flex flex-col items-center justify-center p-10 text-white">
        <img src={Logo} alt="Glamtica Logo" className="w-48 h-48 mb-6" />
        <h1 className="text-4xl font-bold text-center">Glamtica</h1>
        <p className="mt-4 text-lg text-center text-gray-300">Establece una nueva contraseña para tu cuenta.</p>
      </div>

      {/* Columna Derecha - Formulario */}
      <div className="flex items-center justify-center p-6 sm:p-12 lg:bg-background">
        <div className="w-full max-w-md">
          {/* Logo para la vista móvil */}
          <div className="lg:hidden flex justify-center mb-8">
            <img src={Logo} alt="Glamtica Logo" className="w-36 h-36" />
          </div>
          <Card className="border-none shadow-none lg:border lg:shadow-sm">
            <CardHeader className="text-center lg:text-left">
              <CardTitle className="text-2xl">Restablecer Contraseña</CardTitle>
              <CardDescription>Introduce y confirma tu nueva contraseña.</CardDescription>
            </CardHeader>
            <CardContent>
              {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
              {token ? (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nueva Contraseña</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} className="bg-gray-50" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="space-y-2 pt-2">
                      <PasswordRequirement isValid={passwordChecks.length} text="Al menos 8 caracteres" />
                      <PasswordRequirement isValid={passwordChecks.uppercase} text="Al menos una letra mayúscula" />
                      <PasswordRequirement isValid={passwordChecks.lowercase} text="Al menos una letra minúscula" />
                      <PasswordRequirement isValid={passwordChecks.number} text="Al menos un número" />
                      <PasswordRequirement isValid={passwordChecks.specialChar} text="Al menos un carácter especial (!@#$%^&*)" />
                    </div>
                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirmar Contraseña</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} className="bg-gray-50" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? 'Actualizando...' : 'Actualizar Contraseña'}
                    </Button>
                  </form>
                </Form>
              ) : (
                <p className="text-center text-muted-foreground">Verificando token...</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;

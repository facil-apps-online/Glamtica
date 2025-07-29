import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import Logo from '@/assets/images/glamtica.app.png';
import { useCreatePasswordResetToken } from '@/hooks/useUserActions';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  in: {
    opacity: 1,
    y: 0,
  },
  out: {
    opacity: 0,
    y: -20,
  },
};

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.5,
};

const AuthPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetLink, setResetLink] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();
  const createPasswordResetTokenMutation = useCreatePasswordResetToken();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const role = await login(email, password);
      toast({
        title: "Inicio de sesión exitoso",
        description: "Bienvenido de nuevo.",
      });

      // Redirección basada en el rol devuelto
      if (role === 'super_admin') {
        navigate('/superadmin');
      } else {
        navigate('/'); // Redirección por defecto para otros roles
      }

    } catch (error: any) {
      toast({
        title: "Error de inicio de sesión",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      toast({
        title: "Email Requerido",
        description: "Por favor, introduce tu email para generar el enlace de recuperación.",
        variant: "destructive",
      });
      return;
    }
    
    console.log('Enviando email para recuperación:', email); // <-- CONSOLE LOG AÑADIDO

    try {
      const result = await createPasswordResetTokenMutation.mutateAsync(email);
      // Construimos el enlace manualmente en el cliente
      const fullLink = `${window.location.origin}/update-password?token=${result.token}`;
      setResetLink(fullLink);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <motion.div
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
        className="min-h-screen w-full bg-brand-primary lg:grid lg:grid-cols-2"
      >
        {/* Columna Izquierda */}
        <div className="hidden lg:flex flex-col items-center justify-center p-10 text-white">
          <img src={Logo} alt="Glamtica.app Logo" className="w-48 h-48 mb-6" />
          <h1 className="text-4xl font-bold text-center">Bienvenido a Glamtica.app</h1>
          <p className="mt-4 text-lg text-center text-gray-300">La solución todo en uno para la gestión de tu negocio de belleza.</p>
        </div>

        {/* Columna Derecha */}
        <div className="flex items-center justify-center p-6 sm:p-12 lg:bg-background">
          <div className="w-full max-w-md">
            <div className="lg:hidden flex justify-center mb-8">
              <img src={Logo} alt="Glamtica.app Logo" className="w-36 h-36" />
            </div>
            <Card className="border-none shadow-none lg:border lg:shadow-sm">
              <CardHeader className="text-center lg:text-left">
                <CardTitle className="text-2xl">Iniciar Sesión</CardTitle>
                <CardDescription>Accede a tu cuenta para continuar</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-gray-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="login-password">Contraseña</Label>
                      <Button
                        type="button"
                        variant="link"
                        className="p-0 h-auto text-xs"
                        onClick={handlePasswordReset}
                        disabled={createPasswordResetTokenMutation.isPending}
                      >
                        ¿Olvidaste tu contraseña?
                      </Button>
                    </div>
                    <Input
                      id="login-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="bg-gray-50"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full mt-6" 
                    disabled={loading}
                  >
                    {loading ? "Cargando..." : "Iniciar Sesión"}
                  </Button>
                </form>
              </CardContent>
              <CardFooter className="flex justify-center text-sm">
                <p>¿No tienes una cuenta?&nbsp;
                  <Link to="/register-tenant" className="font-semibold text-brand-primary hover:underline">
                    Regístrate aquí
                  </Link>
                </p>
              </CardFooter>
            </Card>
          </div>
        </div>
      </motion.div>

      <AlertDialog open={!!resetLink} onOpenChange={() => setResetLink(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enlace de Recuperación Generado</AlertDialogTitle>
            <AlertDialogDescription>
              Copia y pega el siguiente enlace en tu navegador para establecer una nueva contraseña.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="p-4 bg-muted rounded-md text-sm break-all">
            {resetLink}
          </div>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setResetLink(null)}>
              Cerrar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AuthPage;

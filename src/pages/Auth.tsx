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
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const redirectUrl = await login(email, password); // Capturar la URL
      toast({
        title: "Inicio de sesión exitoso",
        description: "Bienvenido de nuevo.",
      });
      navigate(redirectUrl); // Usar la URL devuelta
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

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className="min-h-screen w-full bg-brand-primary lg:grid lg:grid-cols-2"
    >
      {/* Columna Izquierda - Panel de Bienvenida */}
      <div className="hidden lg:flex flex-col items-center justify-center p-10 text-white">
        <img src={Logo} alt="Glamtica.app Logo" className="w-48 h-48 mb-6" />
        <h1 className="text-4xl font-bold text-center">Bienvenido a Glamtica.app</h1>
        <p className="mt-4 text-lg text-center text-gray-300">La solución todo en uno para la gestión de tu negocio de belleza.</p>
      </div>

      {/* Columna Derecha - Formulario */}
      <div className="flex items-center justify-center p-6 sm:p-12 lg:bg-background">
        <div className="w-full max-w-md">
          {/* Logo para la vista móvil */}
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
                    placeholder=""
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-gray-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Contraseña</Label>
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
  );
};

export default AuthPage;
# Guía de Implementación del Sistema de Autenticación Custom

Este documento detalla la implementación de un sistema de autenticación y autorización personalizado, diseñado para ser robusto, seguro y adaptable a entornos multitenant. Se basa en Supabase como backend de base de datos y funciones Edge, y React/TypeScript en el frontend.

## 1. Visión General del Sistema

El sistema de autenticación se desvía del Auth nativo de Supabase para permitir una gestión de usuarios, roles y permisos completamente personalizada, esencial para una arquitectura multitenant. Utiliza JSON Web Tokens (JWT) para la gestión de sesiones y funciones de base de datos (PostgreSQL) junto con Supabase Edge Functions para la lógica de negocio crítica.

**Componentes Clave:**
-   **Backend (Supabase/PostgreSQL):**
    -   Funciones PostgreSQL para la lógica de login y configuración de contexto de sesión (RLS).
    -   Tablas personalizadas para `users`, `roles`, `permissions`, `tenants`, `branches`, etc.
    -   Edge Functions para operaciones sensibles como el hashing de contraseñas y la generación de JWT.
-   **Frontend (React/TypeScript):**
    -   `AuthContext` para la gestión centralizada del estado de autenticación.
    -   Manejo de JWT en `localStorage`.
    -   Páginas de autenticación y rutas protegidas.

## 2. Implementación del Backend (Supabase/PostgreSQL)

### 2.1. Esquema de Base de Datos

Se requieren las siguientes tablas (ejemplo simplificado):

```sql
-- Tabla de Tenants (Empresas)
CREATE TABLE public.tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    -- ... otros campos del tenant
);

-- Tabla de Roles
CREATE TABLE public.roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE
);

-- Tabla de Usuarios
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL, -- Almacena el hash de la contraseña
    tenant_id UUID REFERENCES public.tenants(id),
    role_id UUID REFERENCES public.roles(id),
    is_active BOOLEAN DEFAULT TRUE,
    -- ... otros campos del usuario
);

-- Tabla de Sedes (Branches)
CREATE TABLE public.branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES public.tenants(id),
    name TEXT NOT NULL,
    -- ... otros campos de la sede
);

-- Otras tablas para permisos, sesiones, etc. según necesidad.
```

### 2.2. Habilitar Extensión `pgjwt`

Para decodificar JWTs directamente en PostgreSQL (necesario para RLS), habilita la extensión `pgjwt`:

```sql
CREATE EXTENSION IF NOT EXISTS pgjwt WITH SCHEMA public;
```

### 2.3. Edge Function: `hash-password` (Deno/TypeScript)

Esta función se encarga de hashear y verificar contraseñas de forma segura utilizando `scrypt` (o un algoritmo similar). Se despliega como una Edge Function de Supabase.

**`supabase/functions/hash-password/index.ts`:**

```typescript
import { serve } from "https://deno.land/std@0.224.0/http/mod.ts";
import { hash, verify } from "https://deno.land/x/scrypt@v1.0.0/mod.ts";

serve(async (req) => {
  const url = new URL(req.url);
  if (req.method === "POST") {
    try {
      if (url.pathname.endsWith("/hash")) {
        const { password } = await req.json();
        if (!password) return new Response(JSON.stringify({ error: "Password is required" }), { status: 400 });
        const hashedPassword = await hash(password);
        return new Response(JSON.stringify({ hash: hashedPassword }), { status: 200 });
      } else if (url.pathname.endsWith("/verify")) {
        const { password, hash: receivedHash } = await req.json();
        if (!password || !receivedHash) return new Response(JSON.stringify({ error: "Password and hash are required" }), { status: 400 });
        const isMatch = await verify(password, receivedHash);
        return new Response(JSON.stringify({ match: isMatch }), { status: 200 });
      } else {
        return new Response("Not Found", { status: 404 });
      }
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    }
  }
  return new Response("Method Not Allowed", { status: 405 });
});
```

### 2.4. Edge Function: `generate-jwt` (Deno/TypeScript)

Esta función crea un JWT personalizado con los claims necesarios (user_id, email, role, tenant_id, branch_id). Se despliega como una Edge Function de Supabase.

**`supabase/functions/generate-jwt/index.ts`:**

```typescript
import { serve } from "https://deno.land/std@0.224.0/http/mod.ts";
import { SignJWT } from "https://deno.land/x/jose@v5.2.3/index.ts";

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  if (req.method === "POST") {
    try {
      const { user_id, email, role, tenant_id, branch_id, jwt_secret, audience } = await req.json();
      if (!jwt_secret || !audience) return new Response(JSON.stringify({ error: "Missing JWT secret or audience." }), { status: 400 });

      const secret = new TextEncoder().encode(jwt_secret);
      const jwt = await new SignJWT({
        sub: user_id, email, role, tenant_id, branch_id,
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("1h")
        .setAudience(audience)
        .sign(secret);

      return new Response(JSON.stringify({ token: jwt }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
    }
  }
  return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
});
```

### 2.5. Función PostgreSQL: `login_user`

Esta función maneja la lógica de inicio de sesión, verifica las credenciales llamando a la Edge Function `hash-password` y devuelve los datos del usuario para la generación del JWT en el frontend.

**`supabase/migrations/<timestamp>_login_user.sql`:**

```sql
CREATE OR REPLACE FUNCTION public.login_user(
    p_email TEXT,
    p_password TEXT,
    p_request_ip INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    user_record RECORD;
    verify_response JSON;
BEGIN
    SELECT
        u.id, u.password_hash, u.tenant_id, u.branch_id, r.name AS role_name
    INTO
        user_record
    FROM
        public.users u
    JOIN
        public.roles r ON u.role_id = r.id
    WHERE
        u.email = p_email AND u.is_active = TRUE;

    IF user_record.id IS NULL THEN
        PERFORM public.log_audit_action(
            p_action := 'user_login_failed'::text,
            p_object_type := 'users'::text,
            p_object_id := NULL,
            p_metadata := json_build_object('email', p_email, 'reason', 'User not found')::jsonb,
            p_ip_address := p_request_ip,
            p_user_agent := p_user_agent
        );
        RETURN json_build_object('success', FALSE, 'message', 'Credenciales inválidas');
    END IF;

    -- Call hash-password Edge Function to verify password
    SELECT * INTO verify_response FROM net.http_post(
        url := 'https://<YOUR_SUPABASE_PROJECT_REF>.supabase.co/functions/v1/hash-password/verify',
        headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer <YOUR_SUPABASE_ANON_KEY>'),
        body := jsonb_build_object('password', p_password, 'hash', user_record.password_hash)
    );

    IF verify_response IS NULL OR (verify_response->>'status_code')::INT <> 200 OR NOT (verify_response->'content')->>'match' = 'true' THEN
        PERFORM public.log_audit_action(
            p_action := 'user_login_failed'::text,
            p_object_type := 'users'::text,
            p_object_id := user_record.id,
            p_metadata := json_build_object('email', p_email, 'reason', 'Invalid password')::jsonb,
            p_ip_address := p_request_ip,
            p_user_agent := p_user_agent,
            p_tenant_id := user_record.tenant_id,
            p_branch_id := user_record.branch_id
        );
        RETURN json_build_object('success', FALSE, 'message', 'Credenciales inválidas');
    END IF;

    PERFORM public.log_audit_action(
        p_action := 'user_login_success'::text,
        p_object_type := 'users'::text,
        p_object_id := user_record.id,
        p_metadata := json_build_object('email', p_email)::jsonb,
        p_ip_address := p_request_ip,
        p_user_agent := p_user_agent,
        p_tenant_id := user_record.tenant_id,
        p_branch_id := user_record.branch_id
    );

    RETURN json_build_object(
        'success', TRUE,
        'user_id', user_record.id,
        'email', p_email,
        'role', user_record.role_name,
        'tenant_id', user_record.tenant_id,
        'branch_id', user_record.branch_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.login_user(TEXT, TEXT, INET, TEXT) TO public;
```

**Nota:** Reemplaza `<YOUR_SUPABASE_PROJECT_REF>` y `<YOUR_SUPABASE_ANON_KEY>` con tus valores reales.

### 2.6. Función PostgreSQL: `set_session_context` (para RLS)

Esta función decodifica el JWT y establece variables de sesión que pueden ser utilizadas por las políticas de Row Level Security (RLS) para filtrar datos por `tenant_id`, `user_id`, etc.

**`supabase/migrations/<timestamp>_set_session_context.sql`:**

```sql
CREATE OR REPLACE FUNCTION public.set_session_context(
    p_jwt_token TEXT,
    p_jwt_secret TEXT
)
RETURNS VOID AS $$
DECLARE
    claims JSONB;
    user_id_val UUID;
    tenant_id_val UUID;
    branch_id_val UUID;
    role_name_val TEXT;
BEGIN
    IF p_jwt_token IS NULL OR p_jwt_token = '' THEN
        PERFORM set_config('app.current_user_id', '', FALSE);
        PERFORM set_config('app.current_tenant_id', '', FALSE);
        PERFORM set_config('app.current_branch_id', '', FALSE);
        PERFORM set_config('app.current_role_name', '', FALSE);
        RETURN;
    END IF;

    claims := public.verify(p_jwt_token, p_jwt_secret);

    user_id_val := (claims->>'sub')::UUID;
    tenant_id_val := (claims->>'tenant_id')::UUID;
    branch_id_val := (claims->>'branch_id')::UUID;
    role_name_val := claims->>'role';

    PERFORM set_config('app.current_user_id', user_id_val::text, FALSE);
    PERFORM set_config('app.current_tenant_id', tenant_id_val::text, FALSE);
    PERFORM set_config('app.current_branch_id', branch_id_val::text, FALSE);
    PERFORM set_config('app.current_role_name', role_name_val::text, FALSE);

EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error setting session context: %', SQLERRM;
        PERFORM set_config('app.current_user_id', '', FALSE);
        PERFORM set_config('app.current_tenant_id', '', FALSE);
        PERFORM set_config('app.current_branch_id', '', FALSE);
        PERFORM set_config('app.current_role_name', '', FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.set_session_context(TEXT, TEXT) TO authenticated;
```

**Nota:** Asegúrate de que `app.jwt_secret` esté configurado como una variable de entorno en tu base de datos Supabase.

## 3. Implementación del Frontend (React/TypeScript)

### 3.1. Configuración de Variables de Entorno

Crea un archivo `.env` en la raíz de tu proyecto React con las siguientes variables:

```env
VITE_SUPABASE_URL="https://<YOUR_SUPABASE_PROJECT_REF>.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="<YOUR_SUPABASE_ANON_KEY>"
VITE_SUPABASE_JWT_SECRET="<YOUR_JWT_SECRET>"
```

### 3.2. `AuthContext.tsx`

Este contexto maneja el estado de autenticación global, el login y el logout.

**`src/contexts/AuthContext.tsx`:**

```typescript
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { jwtDecode } from 'jwt-decode';

interface AuthUser {
  id: string;
  email: string;
  // Añadir otras propiedades del usuario según los claims del JWT
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('supabase.auth.token');

      if (token) {
        try {
          const decodedToken: any = jwtDecode(token);

          if (decodedToken.exp * 1000 < Date.now()) {
            localStorage.removeItem('supabase.auth.token');
            setUser(null);
          } else {
            setUser({
              id: decodedToken.sub,
              email: decodedToken.email,
            });
            // Descomentar cuando set_session_context funcione correctamente
            // await supabase.rpc('set_session_context', { p_jwt_token: token, p_jwt_secret: import.meta.env.VITE_SUPABASE_JWT_SECRET });
          }
        } catch (error) {
          console.error('Invalid token:', error);
          localStorage.removeItem('supabase.auth.token');
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    initializeAuth();

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'supabase.auth.token' && !event.newValue) {
        setUser(null);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const jwtSecret = import.meta.env.VITE_SUPABASE_JWT_SECRET;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const supabaseProjectUrl = import.meta.env.VITE_SUPABASE_URL;
      const audience = `${supabaseProjectUrl}/auth/v1`;

      if (!jwtSecret || !supabaseAnonKey || !supabaseProjectUrl) {
        throw new Error("Environment variables for JWT generation are not configured.");
      }

      const { data, error } = await supabase.rpc('login_user', {
        p_email: email,
        p_password: password,
        p_request_ip: null,
        p_user_agent: navigator.userAgent,
      });

      if (error) {
        throw error;
      }

      if (data.success) {
        const edgeFunctionUrl = `${supabaseProjectUrl}/functions/v1/generate-jwt`;
        const jwtResponse = await fetch(edgeFunctionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseAnonKey,
          },
          body: JSON.stringify({
            user_id: data.user_id,
            email: data.email,
            role: data.role,
            tenant_id: data.tenant_id,
            branch_id: data.branch_id,
            jwt_secret: jwtSecret,
            audience: audience,
          }),
        });

        if (!jwtResponse.ok) {
          const errorData = await jwtResponse.json();
          throw new Error(`Failed to generate JWT: ${jwtResponse.status} - ${errorData.error || jwtResponse.statusText}`);
        }

        const { token: jwt } = await jwtResponse.json();
        localStorage.setItem('supabase.auth.token', jwt);

        // Descomentar cuando set_session_context funcione correctamente
        // await supabase.rpc('set_session_context', { p_jwt_token: jwt, p_jwt_secret: jwtSecret });

        setUser({ id: data.user_id, email: data.email });
      } else {
        throw new Error(data.message || "Credenciales inválidas.");
      }
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      localStorage.removeItem('supabase.auth.token');
      // Descomentar cuando set_session_context funcione correctamente
      // await supabase.rpc('set_session_context', { p_jwt_token: null, p_jwt_secret: null });
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      login,
      logout,
      loading,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

### 3.3. `Auth.tsx` (Página de Autenticación)

Esta página utiliza el `AuthContext` para manejar el inicio de sesión y el registro.

**`src/pages/Auth.tsx`:**

```typescript
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const AuthPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast({
        title: "Inicio de sesión exitoso",
        description: "Bienvenido de nuevo.",
      });
      navigate('/');
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Lógica de registro (ej. llamar a una función RPC de Supabase para registrar un nuevo tenant)
      // const { data, error } = await supabase.rpc('register_new_tenant', { ... });
      // if (error) throw error;

      toast({
        title: "Registro exitoso",
        description: "Tu tenant ha sido creado. Ahora puedes iniciar sesión.",
      });
      // Después del registro exitoso, puedes redirigir al usuario a la pestaña de login
      setEmail('');
      setPassword('');
      setBusinessName('');

    } catch (error: any) {
      toast({
        title: "Error de registro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Tabs defaultValue="login" className="w-[400px]">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
          <TabsTrigger value="register">Registrarse</TabsTrigger>
        </TabsList>
        <TabsContent value="login">
          <Card>
            <CardHeader>
              <CardTitle>Iniciar Sesión</CardTitle>
              <CardDescription>Accede a tu cuenta de Glamtica.app</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleLogin}>
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="tu@ejemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
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
                  />
                </div>
                <Button type="submit" className="w-full mt-6" disabled={loading}>
                  {loading ? "Cargando..." : "Iniciar Sesión"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="register">
          <Card>
            <CardHeader>
              <CardTitle>Registrarse</CardTitle>
              <CardDescription>Crea una nueva cuenta de tenant</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleRegister}>
                <div className="space-y-2">
                  <Label htmlFor="register-business-name">Nombre del Negocio</Label>
                  <Input
                    id="register-business-name"
                    type="text"
                    placeholder="Mi Salón de Belleza"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-email">Email del Administrador</Label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="admin@tu-negocio.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">Contraseña</Label>
                  <Input
                    id="register-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full mt-6" disabled={loading}>
                  {loading ? "Registrando..." : "Registrarse"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AuthPage;
```

### 3.4. `ProtectedRoute.tsx` (Ejemplo de Ruta Protegida)

Este componente asegura que solo los usuarios autenticados puedan acceder a ciertas rutas.

**`src/components/ProtectedRoute.tsx`:**

```typescript
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Cargando autenticación...</div>; // O un spinner
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
```

## 4. Consideraciones Clave y Mejores Prácticas

-   **Secreto JWT (`JWT_SECRET`):** Es CRÍTICO que este secreto sea una cadena larga, aleatoria y segura. **Nunca lo expongas en el código del frontend.** Debe ser una variable de entorno en tu backend (Supabase) y en tu entorno de desarrollo frontend (Vite).
-   **Hashing de Contraseñas:** Siempre usa un algoritmo de hashing seguro y con salting (como `scrypt`, `bcrypt`, `Argon2`). Nunca almacenes contraseñas en texto plano.
-   **Row Level Security (RLS):** Una vez que la función `set_session_context` sea accesible, habilita RLS en tus tablas de base de datos y crea políticas que utilicen las variables de sesión (`app.current_tenant_id`, `app.current_user_id`) para asegurar el aislamiento de datos entre tenants y usuarios.
-   **Manejo de Errores:** Implementa un manejo de errores robusto tanto en el frontend como en el backend para proporcionar retroalimentación clara al usuario y para el monitoreo.
-   **Refresco de Tokens:** Para sesiones de larga duración, considera implementar un mecanismo de refresco de tokens para evitar que los usuarios tengan que iniciar sesión repetidamente.
-   **Seguridad de Edge Functions:** Asegúrate de que tus Edge Functions estén protegidas y solo realicen las operaciones esperadas.
-   **Auditoría:** Utiliza la tabla `audit_logs` para registrar acciones sensibles, como intentos de inicio de sesión (exitosos y fallidos).

Este sistema proporciona una base sólida para una autenticación y autorización personalizadas en aplicaciones multitenant con Supabase.
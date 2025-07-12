import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';

const IS_PRODUCTION = import.meta.env.PROD;

const log = (...args: any[]) => {
  if (!IS_PRODUCTION) {
    console.log(...args);
  }
};

interface AuthUser {
  id: string;
  email: string;
  // Add other user properties as needed
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
  const navigate = useNavigate();

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('supabase.auth.token');
      log('AuthContext: initializeAuth - token from localStorage:', token);

      if (token) {
        try {
          const decodedToken: any = jwtDecode(token);
          log('AuthContext: initializeAuth - decodedToken:', decodedToken);

          if (decodedToken.exp * 1000 < Date.now()) {
            log('AuthContext: initializeAuth - Token expired.');
            localStorage.removeItem('supabase.auth.token');
            setUser(null);
          } else {
            const newUser = {
              id: decodedToken.sub,
              email: decodedToken.email,
            };
            setUser(newUser);
            log('AuthContext: initializeAuth - User set from token:', newUser);
            // await supabase.rpc('set_session_context', { p_jwt_token: token, p_jwt_secret: import.meta.env.VITE_SUPABASE_JWT_SECRET });
          }
        } catch (error) {
          console.error('AuthContext: initializeAuth - Invalid token:', error);
          localStorage.removeItem('supabase.auth.token');
          setUser(null);
        }
      } else {
        log('AuthContext: initializeAuth - No token found in localStorage.');
        setUser(null);
      }
      setLoading(false);
      log('AuthContext: initializeAuth - Loading set to false.');
    };

    initializeAuth();

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'supabase.auth.token' && !event.newValue) {
        log('AuthContext: handleStorageChange - Token removed, setting user to null.');
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
    log('AuthContext: login - Attempting login for:', email);
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
        console.error('AuthContext: login - RPC error:', error);
        throw error;
      }

      if (data.success) {
        log('AuthContext: login - RPC success, data:', data);
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
          console.error('AuthContext: login - JWT generation failed:', errorData);
          throw new Error(`Failed to generate JWT: ${jwtResponse.status} - ${errorData.error || jwtResponse.statusText}`);
        }

        const { token: jwt } = await jwtResponse.json();
        log('AuthContext: login - JWT received:', jwt);
        localStorage.setItem('supabase.auth.token', jwt);
        log('AuthContext: login - JWT stored in localStorage.');

        // await supabase.rpc('set_session_context', { jwt_token: jwt });

        const newUser = { id: data.user_id, email: data.email };
        setUser(newUser);
        log('AuthContext: login - User set after successful login:', newUser);
      } else {
        console.error('AuthContext: login - Login failed, message:', data.message);
        throw new Error(data.message || "Credenciales inválidas.");
      }
    } catch (error: any) {
      console.error('AuthContext: login - Catch block error:', error);
      throw error;
    } finally {
      setLoading(false);
      log('AuthContext: login - Loading set to false.');
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      localStorage.removeItem('supabase.auth.token');
      // await supabase.rpc('set_session_context', { jwt_token: null });
      setUser(null);
      navigate('/auth'); // Redirect to auth page
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
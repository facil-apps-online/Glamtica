import React, { createContext, useContext, useState, useEffect } from 'react';

import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
//console.log('ENTRANDO A AUTHCONTEXT');
// Define la interfaz para una integración de tenant
interface TenantIntegration {
  id: string;
  tenant_id: string | null;
  provider: string;
  access_token: string;
  encrypted_refresh_token: any; // Considerar un tipo más específico si es posible
  account_email: string;
  created_at: string;
  updated_at: string;
}

interface AuthUser {
  id: string;
  email: string;
  role?: string;
  firstName?: string;
  lastName?: string;
  tenant_id?: string;
  branch_id?: string;
  avatarUrl?: string; // Add avatarUrl to the AuthUser interface
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserFromToken: (token: string) => void;
  loading: boolean;
  integrations: TenantIntegration[] | null; // Añadir integraciones al tipo de contexto
  updateIntegrations: (tenantId: string | null | undefined, userRole: string | undefined) => Promise<void>; // Función para actualizar integraciones
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode; supabaseClient: any }> = ({ children, supabaseClient }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [integrations, setIntegrations] = useState<TenantIntegration[] | null>(null);
  const navigate = useNavigate();

  // Helper para obtener integraciones
  const fetchTenantIntegrations = async (currentTenantId: string | null | undefined, currentUserRole: string | undefined) => {
    console.log('[AuthContext - fetchTenantIntegrations] Called with tenantId:', currentTenantId, 'role:', currentUserRole);

    if (!currentTenantId) {
      console.log('[AuthContext - fetchTenantIntegrations] Early exit: No tenantId provided.');
      return [];
    }

    const { data, error } = await supabaseClient.rpc('get_tenant_integrations', {
      p_tenant_id: currentTenantId,
      p_user_role: currentUserRole,
    });
    if (error && error.code !== 'PGRST116') { // PGRST116: "no rows found"
      console.error('[AuthContext - fetchTenantIntegrations] Query error:', error);
      throw new Error(error.message);
    }
    
    console.log(data);
    return data || [];
  };

  // Función para actualizar las integraciones en el estado del contexto
  const updateIntegrations = async (currentTenantId: string | null | undefined, currentUserRole: string | undefined) => {
    console.log('[AuthContext - updateIntegrations] Called with tenantId:', currentTenantId, 'role:', currentUserRole);
    try {
      const fetchedIntegrations = await fetchTenantIntegrations(currentTenantId, currentUserRole);
      setIntegrations(fetchedIntegrations);
      console.log('[AuthContext - updateIntegrations] Integrations state updated:', fetchedIntegrations);
    } catch (error) {
      console.error('[AuthContext - updateIntegrations] Failed to update integrations:', error);
      setIntegrations(null); // Limpiar integraciones en caso de error
    }
  };

  const updateUserFromToken = (token: string) => {
    try {
      // Set the authorization header for all subsequent Supabase requests.
      supabaseClient.global.headers['Authorization'] = `Bearer ${token}`;

      const decodedToken: any = jwtDecode(token);
      console.log('[AuthContext - updateUserFromToken] Decoded token:', decodedToken);
      if (decodedToken.exp * 1000 > Date.now()) {
        setUser({ 
          id: decodedToken.sub, 
          email: decodedToken.email, 
          role: decodedToken.app_metadata.role,
          firstName: decodedToken.first_name,
          lastName: decodedToken.last_name,
          tenant_id: decodedToken.tenant_id,
          branch_id: decodedToken.branch_id,
          avatarUrl: decodedToken.avatar_url, // Map avatar_url from decoded token
        });
        // Después de establecer el usuario, cargar sus integraciones
        console.log('[AuthContext - updateUserFromToken] Calling updateIntegrations after user set.');
        updateIntegrations(decodedToken.tenant_id, decodedToken.app_metadata.role);
      } else {
        console.log('[AuthContext - updateUserFromToken] Token expired, logging out.');
        logout();
      }
    } catch (e) {
      console.error("[AuthContext - updateUserFromToken] Failed to decode token:", e);
      logout();
    }
  };

  useEffect(() => {
    if (supabaseClient) {
      console.log('[AuthContext - useEffect] supabaseClient is available, initializing auth.');
      const token = localStorage.getItem('supabase.auth.token');
      if (token) {
        console.log('[AuthContext - useEffect] Token found, calling updateUserFromToken.');
        updateUserFromToken(token);
      } else {
        console.log('[AuthContext - useEffect] No token found.');
      }
      setLoading(false);
      console.log('[AuthContext - useEffect] Auth initialization complete, loading set to false.');
    }
  }, [supabaseClient]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data: rpcData, error: rpcError } = await supabaseClient.rpc('login_user', {
        p_email: email,
        p_password: password,
      });

      if (!rpcData.success) throw new Error(rpcData.message || "Credenciales inválidas.");

      const { data: functionData, error: functionError } = await supabaseClient.functions.invoke('generate-jwt', {
        body: {
          user_id: rpcData.user_id,
          email: rpcData.email,
          role: rpcData.role,
          tenant_id: rpcData.tenant_id,
          branch_id: rpcData.branch_id,
          first_name: rpcData.first_name,
          last_name: rpcData.last_name,
          avatar_url: rpcData.avatar_url, // Pass avatar_url to generate-jwt
          jwt_secret: import.meta.env.VITE_SUPABASE_JWT_SECRET,
        },
      });
      console.log('[AuthContext] VITE_SUPABASE_JWT_SECRET sent to Edge Function:', import.meta.env.VITE_SUPABASE_JWT_SECRET);

      if (functionError) throw functionError;
      
      const { token } = functionData;
      localStorage.setItem('supabase.auth.token', token);
      updateUserFromToken(token); // Esto ahora también cargará las integraciones

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
      // Clear the authorization header.
      delete supabaseClient.global.headers['Authorization'];

      localStorage.removeItem('supabase.auth.token');
      setUser(null);
      setIntegrations(null); // Limpiar integraciones al cerrar sesión
      navigate('/auth');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  const contextValue = React.useMemo(() => ({
    user, isAuthenticated: !!user, login, logout, updateUserFromToken, loading, integrations, updateIntegrations
  }), [user, loading, integrations, login, logout, updateUserFromToken, updateIntegrations]);

  return (
    <AuthContext.Provider value={contextValue}>
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

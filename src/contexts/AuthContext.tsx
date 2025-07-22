import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';

interface TenantIntegration {
  id: string;
  tenant_id: string | null;
  provider: string;
  access_token: string | null;
  account_email: string | null;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
  encrypted_credentials?: string | null; // Campo nuevo y opcional
  nonce?: string | null; // Campo nuevo y opcional
}

interface AuthUser {
  id: string;
  email: string;
  role?: string;
  firstName?: string;
  lastName?: string;
  tenant_id?: string;
  branch_id?: string;
  avatarUrl?: string;
  country_id?: string | null;
  language_id?: string | null;
  currency_id?: string | null;
  timezone_id?: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserFromToken: (token: string) => void;
  loading: boolean;
  integrations: TenantIntegration[] | null;
  updateIntegrations: (tenantId: string | null | undefined, userRole: string | undefined) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode; supabaseClient: any }> = ({ children, supabaseClient }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [integrations, setIntegrations] = useState<TenantIntegration[] | null>(null);
  const navigate = useNavigate();

  const fetchTenantIntegrations = async (currentTenantId: string | null | undefined, currentUserRole: string | undefined, currentUserId: string | undefined) => {
    if (!currentTenantId || !currentUserRole || !currentUserId) return [];
    const { data, error } = await supabaseClient.rpc('get_tenant_integrations', {
      p_tenant_id: currentTenantId,
      p_user_role: currentUserRole,
      p_requesting_user_id: currentUserId, // Pasar el ID del usuario para la verificación
      p_environment: null,
    });
    if (error && error.code !== 'PGRST116') {
      console.error('[AuthContext - fetchTenantIntegrations] Query error:', error);
      throw new Error(error.message);
    }
    return data || [];
  };

  const updateIntegrations = async (currentTenantId: string | null | undefined, currentUserRole: string | undefined, currentUserId: string | undefined) => {
    try {
      const fetchedIntegrations = await fetchTenantIntegrations(currentTenantId, currentUserRole, currentUserId);
      setIntegrations(fetchedIntegrations);
    } catch (error) {
      console.error('[AuthContext - updateIntegrations] Failed to update integrations:', error);
      setIntegrations(null);
    }
  };

  const updateUserFromToken = (token: string) => {
    try {
      supabaseClient.global.headers['Authorization'] = `Bearer ${token}`;
      const decodedToken: any = jwtDecode(token);

      if (decodedToken.exp * 1000 > Date.now()) {
        const currentUser: AuthUser = { 
          id: decodedToken.sub, 
          email: decodedToken.email, 
          role: decodedToken.app_metadata.role,
          firstName: decodedToken.first_name || null,
          lastName: decodedToken.last_name || null,
          tenant_id: decodedToken.tenant_id || null,
          branch_id: decodedToken.branch_id || null,
          avatarUrl: decodedToken.avatar_url || null,
          country_id: decodedToken.country_id || null,
          language_id: decodedToken.language_id || null,
          currency_id: decodedToken.currency_id || null,
          timezone_id: decodedToken.timezone_id || null,
        };
        setUser(currentUser);
        updateIntegrations(decodedToken.tenant_id, decodedToken.app_metadata.role, decodedToken.sub);
      } else {
        logout();
      }
    } catch (e) {
      console.error("[AuthContext - updateUserFromToken] Failed to decode token:", e);
      logout();
    }
  };

  useEffect(() => {
    if (supabaseClient) {
      const token = localStorage.getItem('supabase.auth.token');
      if (token) {
        updateUserFromToken(token);
      }
      setLoading(false);
    }
  }, [supabaseClient]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error: rpcError } = await supabaseClient.rpc('login_user', {
        p_email: email,
        p_password: password,
      });

      if (rpcError) {
        throw new Error(rpcError.message || "Error en la llamada RPC.");
      }

      // La RPC devuelve un array, incluso con una sola fila.
      const rpcData = data && data[0] ? data[0] : null;

      if (!rpcData || !rpcData.success) {
        throw new Error(rpcData?.message || "Credenciales inválidas.");
      }

      const { data: functionData, error: functionError } = await supabaseClient.functions.invoke('generate-jwt', {
        body: {
          user_id: rpcData.user_id,
          email: rpcData.email,
          role: rpcData.role,
          tenant_id: rpcData.tenant_id,
          branch_id: rpcData.branch_id,
          first_name: rpcData.first_name,
          last_name: rpcData.last_name,
          avatar_url: rpcData.avatar_url,
          country_id: rpcData.country_id,
          language_id: rpcData.language_id,
          currency_id: rpcData.currency_id,
          timezone_id: rpcData.timezone_id,
        },
      });

      if (functionError) throw functionError;
      
      const { token } = functionData;
      localStorage.setItem('supabase.auth.token', token);
      updateUserFromToken(token);

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
      delete supabaseClient.global.headers['Authorization'];
      localStorage.removeItem('supabase.auth.token');
      setUser(null);
      setIntegrations(null);
      navigate('/auth');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  const contextValue = React.useMemo(() => ({
    user, isAuthenticated: !!user, login, logout, updateUserFromToken, loading, integrations, updateIntegrations
  }), [user, loading, integrations]);

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

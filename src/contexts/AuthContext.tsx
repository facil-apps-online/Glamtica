import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useBranchFilterStore } from '@/stores/branchFilterStore';
import { useQuery } from '@tanstack/react-query';

// --- INTERFACES ---
interface Tenant {
  id: string;
  name: string;
  country_id: string;
  logo_url: string | null;
  // ... otros campos del tenant que puedan ser útiles
}

interface UserProfile {
  id: string;
  email: string;
  realEmail?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  country_id?: string;
  language_id?: string;
  currency_id?: string;
  timezone?: string;
}

export interface UserAssignment {
  assignment_id: string;
  tenant_id: string;
  tenant_name:string;
  platform_id: string;
  role_id: string;
  role_name: string;
  role_display_name: string;
  branch_id: string | null;
  branch_name: string | null;
  status: 'active' | 'inactive';
  base_salary?: number;
  default_product_commission_rate?: number;
  default_service_commission_rate?: number;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  tenant: Tenant | null; // Objeto tenant completo
  assignments: UserAssignment[];
  currentAssignment: UserAssignment | null;
  tenantId: string | undefined;
  tenantBranches: any[];
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  switchAssignment: (assignmentId: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  loading: boolean;
  supabaseClient: any;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode; supabaseClient: any }> = ({ children, supabaseClient }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [assignments, setAssignments] = useState<UserAssignment[]>([]);
  const [currentAssignment, setCurrentAssignment] = useState<UserAssignment | null>(null);
  const [tenantBranches, setTenantBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true); // This now only tracks session loading
  const navigate = useNavigate();
  const { toast } = useToast();
  const previousAssignmentRef = useRef<UserAssignment | null>(null);
  const { setBranchId } = useBranchFilterStore();

  const tenantId = currentAssignment?.tenant_id;
  const { data: tenant, isLoading: isTenantLoading } = useQuery({
    queryKey: ['tenant', tenantId],
    queryFn: async () => {
      const { data, error } = await supabaseClient.functions.invoke('tenant-actions', {
        body: { action: 'get-tenant-details' }
      });
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!tenantId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const { data: fetchedTenantBranches } = useQuery({
    queryKey: ['tenantBranches', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      const { data, error } = await supabaseClient.functions.invoke('tenant-actions', {
        body: {
          action: 'get_branches',
          payload: { tenantId: tenantId }
        }
      });
      if (error) {
        console.error('Error fetching tenant branches:', error);
        return [];
      }
      return data;
    },
    enabled: !!tenantId,
    staleTime: 1000 * 60 * 15, // 15 minutes
  });

  useEffect(() => {
    if (fetchedTenantBranches) {
      setTenantBranches(fetchedTenantBranches);
    }
  }, [fetchedTenantBranches]);


  const processSession = useCallback(async (sessionData: Session | null) => {
    try {
      setSession(sessionData);
      setUser(sessionData?.user ?? null);

      if (sessionData?.user) {
        const { app_metadata, user_metadata, id, email } = sessionData.user;
        
        const userProfile: UserProfile = {
          id: id,
          email: email || '',
          realEmail: user_metadata.real_email,
          firstName: user_metadata.first_name,
          lastName: user_metadata.last_name,
          avatarUrl: user_metadata.avatar_url,
          country_id: user_metadata.country_id,
          language_id: user_metadata.language_id,
          currency_id: user_metadata.currency_id,
          timezone: user_metadata.timezone,
        };
        setProfile(userProfile);

        if (!app_metadata?.assignments || app_metadata.assignments.length === 0 || !app_metadata.assignments[0].tenant_name) {
          const platformId = import.meta.env.VITE_GLAMTICA_PLATFORM_ID;
          if (!platformId) throw new Error("Platform ID no configurado.");

          const { error: refreshError } = await supabaseClient.functions.invoke('user-actions', {
            body: {
              action: 'refresh-user-metadata',
              payload: { userId: id, platformId: platformId }
            }
          });

          if (refreshError) {
            throw new Error(`Error al rehidratar metadatos: ${refreshError.message}`);
          }

          await supabaseClient.auth.refreshSession();
          return;
        }

        const allAssignments: UserAssignment[] = app_metadata.assignments || [];
        setAssignments(allAssignments);

        if (allAssignments.length === 0) {
          await supabaseClient.auth.signOut();
          navigate('/auth');
          return;
        }

        let selectedAssignment: UserAssignment | null = null;
        const lastSelectedAssignmentId = localStorage.getItem('lastSelectedAssignmentId');

        if (lastSelectedAssignmentId) {
          selectedAssignment = allAssignments.find(a => a.assignment_id === lastSelectedAssignmentId) || null;
        }

        if (!selectedAssignment) {
          const rolePriority = ['tenant_super_admin', 'tenant_admin', 'tenant_user'];
          for (const roleName of rolePriority) {
            const foundAssignment = allAssignments.find(a => a.role_name === roleName);
            if (foundAssignment) {
              selectedAssignment = foundAssignment;
              break;
            }
          }
        }
        
        if (!selectedAssignment) {
          selectedAssignment = allAssignments[0];
        }

        setCurrentAssignment(selectedAssignment);

      } else {
        setProfile(null);
        setAssignments([]);
        setCurrentAssignment(null);
      }
    } catch (error) {
      console.error("Error procesando la sesión:", error);
      setAssignments([]);
      setCurrentAssignment(null);
      await supabaseClient.auth.signOut();
      navigate('/auth');
    } finally {
      setLoading(false);
    }
  }, [supabaseClient, navigate]);

  useEffect(() => {
    setLoading(true);
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((_event, session) => {
        processSession(session);
    });
    return () => subscription.unsubscribe();
  }, [supabaseClient, processSession]);

  const login = async (email: string, password: string) => {
    await supabaseClient.auth.signOut();
    
    const platformId = import.meta.env.VITE_GLAMTICA_PLATFORM_ID;
    if (!platformId) {
      throw new Error("Platform ID no está configurado en el cliente.");
    }

    const { data, error } = await supabaseClient.functions.invoke('user-actions', {
      body: {
        action: 'login-tenant',
        payload: { email, password, platform_id: platformId },
      },
    });

    if (error) {
      console.error("Error invoking user-actions function:", error);
      throw new Error("Error en la comunicación con el servidor. Por favor, intenta de nuevo.");
    }
    
    if (!data.success) {
      console.error("Login failed:", data.message);
      throw new Error(data.message || "Error desconocido durante el inicio de sesión.");
    }

    if (data.session) {
      await supabaseClient.auth.setSession(data.session);

      const { error: refreshError } = await supabaseClient.functions.invoke('user-actions', {
        body: {
          action: 'refresh-user-metadata',
          payload: { userId: data.session.user.id, platformId: platformId }
        }
      });

      if (refreshError) {
        console.error(`Error al rehidratar metadatos: ${refreshError.message}`);
      }

      await supabaseClient.auth.refreshSession();
      
      navigate('/app');
    } else {
      throw new Error("No se recibieron datos de sesión válidos del servidor.");
    }
  };

  const logout = async () => {
    await supabaseClient.auth.signOut();
    navigate('/auth');
  };
  
  const refreshUser = useCallback(async () => {
    const { data, error } = await supabaseClient.auth.refreshSession();
    if (data.session) {
      processSession(data.session);
    }
    if(error) {
      console.error("Error refreshing session:", error);
      logout();
    }
  }, [supabaseClient, processSession]);

  const switchAssignment = async (assignmentId: string) => {
    if (!user) throw new Error("Usuario no autenticado para cambiar de asignación.");

    const newAssignment = assignments.find(a => a.assignment_id === assignmentId);
    if (!newAssignment) {
      console.error("Error: La asignación seleccionada no se encontró en la lista del usuario.");
      return;
    }

    previousAssignmentRef.current = currentAssignment;
    setCurrentAssignment(newAssignment);
    setBranchId(newAssignment.branch_id || 'all');
    localStorage.setItem('lastSelectedAssignmentId', assignmentId);

    try {
      const { data, error } = await supabaseClient.functions.invoke('user-actions', {
        body: {
          action: 'switch-assignment',
          payload: { userId: user.id, newAssignmentId: assignmentId },
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.message || "Error al cambiar de asignación en el backend.");

      await refreshUser();
      toast({
        title: "Contexto cambiado",
        description: `Ahora estás en el contexto de ${newAssignment.tenant_name}${newAssignment.branch_name ? ' (' + newAssignment.branch_name + ')' : ''}.`,
        variant: "success",
      });

    } catch (error) {
      console.error("Fallo al notificar al backend o refrescar la sesión después del cambio de contexto:", error);
      setCurrentAssignment(previousAssignmentRef.current);
      localStorage.setItem('lastSelectedAssignmentId', previousAssignmentRef.current?.assignment_id || '');

      toast({
        title: "Error al cambiar de contexto",
        description: error.message || "Ocurrió un error inesperado al cambiar de contexto.",
        variant: "destructive",
      });
    }
  };

  const overallLoading = loading || (!!tenantId && isTenantLoading);

  const contextValue = useMemo(() => ({
    session,
    user,
    profile,
    tenant: tenant || null,
    assignments,
    currentAssignment,
    tenantId: currentAssignment?.tenant_id,
    tenantBranches,
    isAuthenticated: !!currentAssignment && currentAssignment.status === 'active',
    login,
    logout,
    switchAssignment,
    refreshUser,
    loading: overallLoading,
    supabaseClient,
  }), [session, user, profile, tenant, assignments, currentAssignment, tenantBranches, overallLoading, refreshUser, supabaseClient]);

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
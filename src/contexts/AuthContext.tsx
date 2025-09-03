import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useBranchFilterStore } from '@/stores/branchFilterStore';

// --- INTERFACES ---
interface UserProfile {
  id: string;
  email: string; // Correo sintético, usado como ID
  realEmail?: string; // Correo real para visualización
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
  tenant_name: string;
  platform_id: string; // Added platform_id
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
  assignments: UserAssignment[];
  currentAssignment: UserAssignment | null;
  tenantBranches: any[]; // Añadido: Exponer las sucursales del tenant
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  switchAssignment: (assignmentId: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  loading: boolean;
  supabaseClient: any; // Añadido: Exponer el cliente de Supabase
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode; supabaseClient: any }> = ({ children, supabaseClient }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [assignments, setAssignments] = useState<UserAssignment[]>([]);
  const [currentAssignment, setCurrentAssignment] = useState<UserAssignment | null>(null);
  const [tenantBranches, setTenantBranches] = useState<any[]>([]); // Añadido
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const previousAssignmentRef = useRef<UserAssignment | null>(null);
  const { setBranchId } = useBranchFilterStore();

  const processSession = useCallback(async (sessionData: Session | null) => {
    try {
      setSession(sessionData);
      setUser(sessionData?.user ?? null);

      if (sessionData?.user) {
        
        const { app_metadata, user_metadata, id, email } = sessionData.user;
        
        
        const userProfile: UserProfile = {
          id: id,
          email: email || '',
          realEmail: user_metadata.email, // <-- Añadido
          firstName: user_metadata.first_name,
          lastName: user_metadata.last_name,
          avatarUrl: user_metadata.avatar_url,
          country_id: user_metadata.country_id,
          language_id: user_metadata.language_id,
          currency_id: user_metadata.currency_id,
          timezone: user_metadata.timezone,
        };
        setProfile(userProfile);

        try {
          const platformId = import.meta.env.VITE_GLAMTICA_PLATFORM_ID;
          if (!platformId) {
            console.error("VITE_GLAMTICA_PLATFORM_ID no está definido.");
            throw new Error("Platform ID not configured.");
          }

          // 1. Fetch active assignments from the Edge Function
          const { data: functionResponse, error: functionError } = await supabaseClient.functions.invoke('user-actions', {
            body: {
              action: 'get-active-assignments',
              payload: { userId: id, platformId: platformId }
            }
          });

          if (functionError) {
            console.error("Error invoking get-active-assignments function:", functionError);
            throw new Error(functionError.message || "Error en la comunicación con el servidor.");
          }
          
          if (!functionResponse.success) {
            console.error("Edge function returned an error:", functionResponse.message);
            throw new Error(functionResponse.message || "Error desconocido al obtener asignaciones.");
          }

          const allAssignments: UserAssignment[] = functionResponse.assignments;
          setAssignments(allAssignments);

          // If there are no active assignments, log out the user
          if (!allAssignments || allAssignments.length === 0) {
            console.warn('Usuario autenticado sin asignaciones activas para esta plataforma. Cerrando sesión.');
            await supabaseClient.auth.signOut();
            navigate('/auth');
            return;
          }

          // 2. Determine the current assignment (this logic remains the same)
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

        } catch (error) {
          console.error("Error processing user session and assignments:", error);
          setAssignments([]);
          setCurrentAssignment(null);
          await supabaseClient.auth.signOut();
          navigate('/auth');
          return;
        }
      } else {
        // Si no hay sessionData.user, asegurar que todo esté limpio.
        setProfile(null);
        setAssignments([]);
        setCurrentAssignment(null);
      }
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
      throw new Error(error.message || "Error en la comunicación con el servidor.");
    }
    if (!data.success) {
      console.error("Login failed, data.success is false:", data);
      throw new Error(data.message || "Error desconocido durante el inicio de sesión.");
    }

    if (data.session) {
      await supabaseClient.auth.setSession(data.session);
      await processSession(data.session);
      navigate('/');
    } else {
      console.warn("La función Edge no devolvió datos de sesión.");
    }
  };

  const logout = async () => {
    await supabaseClient.auth.signOut();
    navigate('/auth');
  };
  
  const refreshUser = useCallback(async () => {
    await supabaseClient.auth.refreshSession();
    // La actualización de la sesión será manejada automáticamente 
    // por el listener onAuthStateChange.
  }, [supabaseClient]);

  const switchAssignment = async (assignmentId: string) => {
    if (!user) throw new Error("Usuario no autenticado para cambiar de asignación.");

    const newAssignment = assignments.find(a => a.assignment_id === assignmentId);
    if (!newAssignment) {
      console.error("Error: La asignación seleccionada no se encontró en la lista del usuario.");
      return;
    }

    // Guardar el currentAssignment actual antes de intentar el cambio
    previousAssignmentRef.current = currentAssignment;

    // 1. Actualizar el estado local inmediatamente para una respuesta de UI rápida.
    setCurrentAssignment(newAssignment);
    setBranchId(newAssignment.branch_id || 'all');
    
    // Guardar la asignación seleccionada en localStorage
    localStorage.setItem('lastSelectedAssignmentId', assignmentId);

    // 2. Notificar al backend del cambio en segundo plano.
    try {
      const { data, error } = await supabaseClient.functions.invoke('user-actions', {
        body: {
          action: 'switch-assignment',
          payload: { userId: user.id, newAssignmentId: assignmentId },
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.message || "Error al cambiar de asignación en el backend.");

      // 3. Refrescar la sesión de Supabase en segundo plano para mantener la consistencia.
      await refreshUser();
      toast({
        title: "Contexto cambiado",
        description: `Ahora estás en el contexto de ${newAssignment.tenant_name}${newAssignment.branch_name ? ' (' + newAssignment.branch_name + ')' : ''}.`,
        variant: "default",
      });

    } catch (error) {
      console.error("Fallo al notificar al backend o refrescar la sesión después del cambio de contexto:", error);
      // Revertir el currentAssignment si el backend falla
      setCurrentAssignment(previousAssignmentRef.current);
      localStorage.setItem('lastSelectedAssignmentId', previousAssignmentRef.current?.assignment_id || '');

      toast({
        title: "Error al cambiar de contexto",
        description: error.message || "Ocurrió un error inesperado al cambiar de contexto.",
        variant: "destructive",
      });
    }
  };

  const contextValue = useMemo(() => ({
    session,
    user,
    profile,
    assignments,
    currentAssignment,
    tenantBranches, // Añadido
    isAuthenticated: !!currentAssignment && currentAssignment.status === 'active',
    login,
    logout,
    switchAssignment,
    refreshUser,
    loading,
    supabaseClient,
  }), [session, user, profile, assignments, currentAssignment, tenantBranches, loading, refreshUser, supabaseClient]);

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

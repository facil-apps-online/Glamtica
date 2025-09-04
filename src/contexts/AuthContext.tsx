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
        
        console.log('AuthContext: Procesando sesión. app_metadata:', JSON.stringify(app_metadata, null, 2));
        
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

        // --- LÓGICA DE REHIDRATACIÓN DEL JWT ---
        // Forzar la rehidratación si las asignaciones no existen, están vacías,
        // o si son incompletas (no tienen los nombres necesarios).
        if (!app_metadata?.assignments || app_metadata.assignments.length === 0 || !app_metadata.assignments[0].tenant_name) {
          console.log('JWT no hidratado o con datos incompletos. Llamando a refresh-user-metadata...');
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

          console.log('Metadatos actualizados en DB. Refrescando sesión para obtener nuevo JWT...');
          await supabaseClient.auth.refreshSession();
          return;
        }
        // --- FIN DE LA LÓGICA DE REHIDRATACIÓN ---

        const allAssignments: UserAssignment[] = app_metadata.assignments || [];
        setAssignments(allAssignments);

        if (allAssignments.length === 0) {
          console.warn('Usuario autenticado pero sin asignaciones activas. Cerrando sesión.');
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
      // This will now only catch network errors, as the function itself always returns 200.
      console.error("Error invoking user-actions function:", error);
      throw new Error("Error en la comunicación con el servidor. Por favor, intenta de nuevo.");
    }
    
    if (!data.success) {
      // This will now correctly catch business logic errors (e.g., invalid credentials).
      console.error("Login failed:", data.message);
      throw new Error(data.message || "Error desconocido durante el inicio de sesión.");
    }

    console.log('AuthContext: Respuesta exitosa de la función de login. Sesión recibida:', JSON.stringify(data.session, null, 2));

    if (data.session) {
      await supabaseClient.auth.setSession(data.session);
      await processSession(data.session);
      navigate('/');
    } else {
      console.warn("La función Edge no devolvió datos de sesión válidos.");
      throw new Error("No se recibieron datos de sesión válidos del servidor.");
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
        variant: "success",
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

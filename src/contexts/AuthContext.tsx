import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';

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
  branch_id: string | null;
  branch_name: string | null;
  status: 'active' | 'inactive';
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  assignments: UserAssignment[];
  currentAssignment: UserAssignment | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<string | null>;
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
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const processSession = useCallback((sessionData: Session | null) => {
    //console.log("Entering processSession with sessionData:", sessionData);
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

      if (app_metadata.assignments && Array.isArray(app_metadata.assignments) && app_metadata.assignments.length > 0) {
        const platformId = import.meta.env.VITE_GLAMTICA_PLATFORM_ID;
        if (!platformId) {
          console.error("VITE_GLAMTICA_PLATFORM_ID no está definido en las variables de entorno.");
          // Decide how to handle this critical error: throw, return, or set a default
          // For now, we'll proceed with an empty platform_id, but this should be addressed.
        }

        const allAssignments: UserAssignment[] = app_metadata.assignments.map((a: any) => ({
          assignment_id: a.assignment_id,
          tenant_id: a.tenant_id,
          tenant_name: a.tenant_name,
          platform_id: platformId || '', // Assign platformId from environment variable
          role_id: a.role_id,
          role_name: a.role_name,
          branch_id: a.branch_id || null,
          branch_name: a.branch_name || null,
          status: a.status || 'inactive',
        }));
        setAssignments(allAssignments);
        setCurrentAssignment(allAssignments[0]);
      } else {
        setAssignments([]);
        setCurrentAssignment(null);
      }
    } else {
      setProfile(null);
      setAssignments([]);
      setCurrentAssignment(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    setLoading(true);
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((_event, session) => processSession(session));
    return () => subscription.unsubscribe();
  }, [supabaseClient, processSession]);

  const login = async (email: string, password: string) => {
    const platformId = import.meta.env.VITE_GLAMTICA_PLATFORM_ID;
    if (!platformId) {
      throw new Error("Platform ID no está configurado en el cliente.");
    }

    //console.log("Attempting login for email:", email);
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

    // Asumiendo que la función Edge devuelve un objeto 'session' en un inicio de sesión exitoso
    if (data.session) {
      //console.log("Función Edge devolvió datos de sesión. Estableciendo sesión...");
      await supabaseClient.auth.setSession(data.session);
      //console.log("Sesión establecida. Refrescando usuario...");
      await refreshUser(); // Refrescar para asegurar que todo el contexto se actualice
    } else {
      console.warn("La función Edge no devolvió datos de sesión. Intentando refrescar usuario de todos modos.");
      await refreshUser();
    }
    
    
    
    return data.user?.app_metadata?.assignments?.[0]?.role || null;
  };

  const logout = async () => {
    await supabaseClient.auth.signOut();
    navigate('/auth');
  };
  
  const refreshUser = useCallback(async () => {
    await supabaseClient.auth.refreshSession();
    const { data: { session } } = await supabaseClient.auth.getSession();
    processSession(session);
  }, [supabaseClient, processSession]);

  const switchAssignment = async (assignmentId: string) => {
    if (!user) throw new Error("Usuario no autenticado para cambiar de asignación.");
    
    const { data, error } = await supabaseClient.functions.invoke('user-actions', {
      body: {
        action: 'switch-assignment',
        payload: { userId: user.id, newAssignmentId: assignmentId },
      },
    });

    if (error) throw error;
    if (!data.success) throw new Error(data.message || "Error al cambiar de asignación.");

    await refreshUser();
  };

  const contextValue = useMemo(() => ({
    session,
    user,
    profile,
    assignments,
    currentAssignment,
    isAuthenticated: !!currentAssignment && currentAssignment.status === 'active',
    login,
    logout,
    switchAssignment,
    refreshUser,
    loading,
    supabaseClient, // Añadido: Exponer el cliente de Supabase
  }), [session, user, profile, assignments, currentAssignment, loading, refreshUser, supabaseClient]);

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
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';

// --- INTERFACES ---
interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  // Campos que podrían venir de user_metadata
  country_id?: string;
  language_id?: string;
  currency_id?: string;
  timezone_id?: string;
}

export interface UserAssignment {
  assignment_id: string; // Puede ser el mismo user_id si la asignación es 1:1
  tenant_id: string;
  tenant_name: string;
  role_id: string;
  role_name: string;
  branch_id: string | null;
  branch_name: string | null;
  status: 'active' | 'inactive';
}

interface AuthContextType {
  session: Session | null;
  profile: UserProfile | null;
  assignments: UserAssignment[];
  currentAssignment: UserAssignment | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
  switchAssignment: (assignmentId: string) => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode; supabaseClient: any }> = ({ children, supabaseClient }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [assignments, setAssignments] = useState<UserAssignment[]>([]);
  const [currentAssignment, setCurrentAssignment] = useState<UserAssignment | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
      (_event: string, session: Session | null) => {
        console.log('%c[AuthContext] onAuthStateChange disparado', 'color: yellow; font-weight: bold;', { event: _event, session });

        setSession(session);

        if (session?.user) {
          const { app_metadata, user_metadata, id, email } = session.user;
          console.log('%c[AuthContext] Sesión encontrada. Procesando metadatos...', 'color: cyan;', { app_metadata, user_metadata });

          const userProfile: UserProfile = {
            id: id,
            email: email || '',
            firstName: user_metadata.first_name,
            lastName: user_metadata.last_name,
            avatarUrl: user_metadata.avatar_url,
          };

          // Lógica actualizada para leer el array de asignaciones
          if (app_metadata.assignments && Array.isArray(app_metadata.assignments) && app_metadata.assignments.length > 0) {
            console.log('%c[AuthContext] Raw assignments from metadata:', 'color: magenta; font-weight: bold;', JSON.stringify(app_metadata.assignments, null, 2));
            
            console.log('%c[AuthContext] Se encontró un array de asignaciones válido.', 'color: green;');
            const allAssignments: UserAssignment[] = app_metadata.assignments.map((a: any) => ({
              assignment_id: a.assignment_id,
              tenant_id: a.tenant_id,
              tenant_name: a.tenant_name,
              role_id: a.role_id,
              role_name: a.role, // El nombre del rol en los metadatos es 'role'
              branch_id: a.branch_id || null,
              branch_name: a.branch_name || null,
              status: a.status || 'inactive',
            }));

            // Establecer la primera asignación como la actual por defecto
            const current = allAssignments[0];
            console.log('%c[AuthContext] Asignación actual establecida:', 'color: green; font-weight: bold;', current);

            setProfile(userProfile);
            setAssignments(allAssignments);
            setCurrentAssignment(current);
          } else {
            console.warn('%c[AuthContext] Usuario autenticado, pero no se encontraron asignaciones válidas en app_metadata.', 'color: orange;');
            // Usuario autenticado pero sin asignaciones válidas
            setProfile(userProfile);
            setCurrentAssignment(null);
            setAssignments([]);
          }
        } else {
          console.log('%c[AuthContext] No hay sesión. Limpiando estado.', 'color: gray;');
          // No hay sesión, limpiar todo
          setProfile(null);
          setCurrentAssignment(null);
          setAssignments([]);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabaseClient]);

  const login = async (email: string, password: string) => {
    const { data: signInData, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) throw error;

    // Después del login, los metadatos pueden no estar frescos en el objeto de sesión inicial.
    // Forzamos una re-lectura para obtener los datos más actualizados.
    // onAuthStateChange se disparará con esta información fresca.
    const { data: { user } } = await supabaseClient.auth.getUser();
    
    if (user?.app_metadata?.assignments && user.app_metadata.assignments.length > 0) {
      // Devolvemos el rol de la primera asignación para que la página de login pueda redirigir.
      return user.app_metadata.assignments[0].role || null;
    }

    return null;
  };

  const logout = async () => {
    await supabaseClient.auth.signOut();
    navigate('/auth');
    // onAuthStateChange se encargará de limpiar el estado
  };

  const switchAssignment = async (assignmentId: string) => {
    // TODO: Implementar la lógica de cambio de asignación.
    // Esto requeriría una RPC que actualice el app_metadata del usuario
    // y luego un supabase.auth.refreshSession() para obtener el nuevo token.
    console.warn('switchAssignment no está implementado todavía.');
    alert('La funcionalidad de cambiar de rol aún no está disponible en la nueva arquitectura.');
  };

  const contextValue = useMemo(() => ({
    session,
    profile,
    assignments,
    currentAssignment,
    isAuthenticated: !!currentAssignment && currentAssignment.status === 'active',
    login,
    logout,
    switchAssignment,
    loading,
  }), [session, profile, assignments, currentAssignment, loading]);

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
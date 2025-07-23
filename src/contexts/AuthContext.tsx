import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';

// --- INTERFACES ---
interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
}

export interface UserAssignment {
  assignment_id: string;
  tenant_id: string;
  tenant_name: string;
  role_id: string;
  role_name: string;
  branch_id: string | null;
  branch_name: string | null;
}

interface AuthContextType {
  profile: UserProfile | null;
  assignments: UserAssignment[];
  currentAssignment: UserAssignment | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<string>;
  logout: () => Promise<void>;
  switchAssignment: (assignmentId: string) => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- CLAVES DE LOCALSTORAGE ---
const TOKEN_KEY = 'supabase.auth.token';

export const AuthProvider: React.FC<{ children: React.ReactNode; supabaseClient: any }> = ({ children, supabaseClient }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [assignments, setAssignments] = useState<UserAssignment[]>([]);
  const [currentAssignment, setCurrentAssignment] = useState<UserAssignment | null>(null);
  const [loading, setLoading] = useState(true); // Inicia cargando
  const navigate = useNavigate();

  const generateAndSetToken = async (profileData: UserProfile, assignment: UserAssignment) => {
    const { data: functionData, error: functionError } = await supabaseClient.functions.invoke('generate-jwt', {
      body: {
        user_id: profileData.id,
        email: profileData.email,
        first_name: profileData.firstName,
        last_name: profileData.lastName,
        avatar_url: profileData.avatarUrl,
        role: assignment.role_name,
        tenant_id: assignment.tenant_id,
        branch_id: assignment.branch_id,
        tenant_name: assignment.tenant_name,
      },
    });

    if (functionError) throw functionError;
    
    const { token } = functionData;
    localStorage.setItem(TOKEN_KEY, token);
    supabaseClient.global.headers['Authorization'] = `Bearer ${token}`;
  };

  const login = async (email: string, password: string): Promise<string> => {
    setLoading(true);
    try {
      const { data, error: rpcError } = await supabaseClient.rpc('login_user', { p_email: email, p_password: password });

      if (rpcError) throw new Error(rpcError.message);
      if (!data || !data.success) throw new Error(data?.message || "Credenciales inválidas.");

      const { profile: userProfile, assignments: userAssignments } = data;
      
      const loadedProfile: UserProfile = {
        id: userProfile.id,
        email: userProfile.email,
        firstName: userProfile.first_name,
        lastName: userProfile.last_name,
        avatarUrl: userProfile.avatar_url,
      };

      setProfile(loadedProfile);
      setAssignments(userAssignments);

      if (userAssignments.length > 0) {
        const firstAssignment = userAssignments[0];
        setCurrentAssignment(firstAssignment);
        await generateAndSetToken(loadedProfile, firstAssignment);

        if (firstAssignment.role_name === 'super_admin') {
          return '/superadmin/dashboard';
        } else {
          return '/';
        }
      } else {
        throw new Error("No tienes roles o tenants asignados.");
      }
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    // ... (lógica de logout simple)
    localStorage.removeItem(TOKEN_KEY);
    setProfile(null);
    setAssignments([]);
    setCurrentAssignment(null);
    navigate('/auth');
  };

  const switchAssignment = async (assignmentId: string) => {
    // ... (lógica de switch)
  };

  // useEffect simple que solo marca la carga como completa
  useEffect(() => {
    setLoading(false);
  }, []);

  const contextValue = useMemo(() => ({
    profile, assignments, currentAssignment, isAuthenticated: !!currentAssignment, login, logout, switchAssignment, loading
  }), [profile, assignments, currentAssignment, loading]);

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
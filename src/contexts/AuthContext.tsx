import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';

// --- INTERFACES ---
interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  country_id?: string;
  language_id?: string;
  currency_id?: string;
  timezone_id?: string;
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
  updateCurrentProfile: (newProfileData: Partial<UserProfile>) => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- CLAVES DE LOCALSTORAGE ---
const TOKEN_KEY = 'supabase.auth.token';
const PROFILE_KEY = 'glamtica.profile';
const ASSIGNMENTS_KEY = 'glamtica.assignments';
const CURRENT_ASSIGNMENT_KEY = 'glamtica.current_assignment';

export const AuthProvider: React.FC<{ children: React.ReactNode; supabaseClient: any }> = ({ children, supabaseClient }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [assignments, setAssignments] = useState<UserAssignment[]>([]);
  const [currentAssignment, setCurrentAssignment] = useState<UserAssignment | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const generateAndSetToken = useCallback(async (profileData: UserProfile, assignment: UserAssignment) => {
    if (!profileData?.id || !assignment?.tenant_id || !assignment?.role_name) {
      console.error("Attempted to generate token with incomplete data", { profileData, assignment });
      throw new Error("Incomplete user profile or assignment data to generate token.");
    }

    const payload = {
      user_id: profileData.id,
      email: profileData.email,
      first_name: profileData.firstName,
      last_name: profileData.lastName,
      avatar_url: profileData.avatarUrl,
      country_id: profileData.country_id,
      language_id: profileData.language_id,
      currency_id: profileData.currency_id,
      timezone_id: profileData.timezone_id,
      role: assignment.role_name,
      tenant_id: assignment.tenant_id,
      branch_id: assignment.branch_id,
      tenant_name: assignment.tenant_name,
    };

    const { data: functionData, error: functionError } = await supabaseClient.functions.invoke('generate-jwt', {
      body: payload,
    });

    if (functionError) throw functionError;
    
    const { token } = functionData;
    localStorage.setItem(TOKEN_KEY, token);
    supabaseClient.global.headers['Authorization'] = `Bearer ${token}`;
    return token;
  }, [supabaseClient]);

  const updateCurrentProfile = useCallback(async (newProfileData: Partial<UserProfile>) => {
    if (!profile || !currentAssignment) return;
    const updatedProfile = { ...profile, ...newProfileData };
    setProfile(updatedProfile);
    localStorage.setItem(PROFILE_KEY, JSON.stringify(updatedProfile));
    await generateAndSetToken(updatedProfile, currentAssignment);
  }, [profile, currentAssignment, generateAndSetToken]);

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
        country_id: userProfile.country_id,
        language_id: userProfile.language_id,
        currency_id: userProfile.currency_id,
        timezone_id: userProfile.timezone_id,
      };
      if (userAssignments.length === 0) throw new Error("No tienes roles o tenants asignados.");
      const superAdminAssignment = userAssignments.find(a => a.role_name === 'super_admin');
      const assignmentToSet = superAdminAssignment || userAssignments[0];
      setProfile(loadedProfile);
      setAssignments(userAssignments);
      setCurrentAssignment(assignmentToSet);
      localStorage.setItem(PROFILE_KEY, JSON.stringify(loadedProfile));
      localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(userAssignments));
      localStorage.setItem(CURRENT_ASSIGNMENT_KEY, JSON.stringify(assignmentToSet));
      await generateAndSetToken(loadedProfile, assignmentToSet);
      return assignmentToSet.role_name === 'super_admin' ? '/superadmin/dashboard' : '/';
    } catch (error: any) {
      console.error('Login error:', error);
      await logout();
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(PROFILE_KEY);
    localStorage.removeItem(ASSIGNMENTS_KEY);
    localStorage.removeItem(CURRENT_ASSIGNMENT_KEY);
    setProfile(null);
    setAssignments([]);
    setCurrentAssignment(null);
    delete supabaseClient.global.headers['Authorization'];
    navigate('/auth');
  };

  const switchAssignment = async (assignmentId: string) => {
    const newAssignment = assignments.find(a => a.assignment_id === assignmentId);
    if (newAssignment && profile) {
      setLoading(true);
      setCurrentAssignment(newAssignment);
      localStorage.setItem(CURRENT_ASSIGNMENT_KEY, JSON.stringify(newAssignment));
      await generateAndSetToken(profile, newAssignment);
      setLoading(false);
      window.location.reload();
    }
  };

  useEffect(() => {
    setLoading(true);
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const storedProfile = localStorage.getItem(PROFILE_KEY);
      const storedAssignments = localStorage.getItem(ASSIGNMENTS_KEY);
      const storedCurrentAssignment = localStorage.getItem(CURRENT_ASSIGNMENT_KEY);
      if (token && storedProfile && storedAssignments && storedCurrentAssignment) {
        const decoded: any = jwtDecode(token);
        if (decoded.exp * 1000 < Date.now()) throw new Error("Token expired");
        supabaseClient.global.headers['Authorization'] = `Bearer ${token}`;
        setProfile(JSON.parse(storedProfile));
        setAssignments(JSON.parse(storedAssignments));
        setCurrentAssignment(JSON.parse(storedCurrentAssignment));
      }
    } catch (error) {
      logout();
    } finally {
      setLoading(false);
    }
  }, [supabaseClient]);

  const contextValue = useMemo(() => ({
    profile, assignments, currentAssignment, isAuthenticated: !!currentAssignment, login, logout, switchAssignment, updateCurrentProfile, loading
  }), [profile, assignments, currentAssignment, loading, login, logout, switchAssignment, updateCurrentProfile]);

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

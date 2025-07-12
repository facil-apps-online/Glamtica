import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export const useAuth = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const logout = async () => {
    // Clear our custom JWT from localStorage
    localStorage.removeItem('supabase.auth.token');

    // Optionally, you might want to clear any Supabase Auth session data if it exists
    // await supabase.auth.signOut(); // This might not be needed if we fully manage auth

    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión correctamente.",
    });
    navigate('/auth'); // Redirect to our custom auth page
  };

  return {
    logout,
  };
};
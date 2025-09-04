import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";

export const useTenantSettings = () => {
  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;

  return useQuery({
    queryKey: ["tenantSettings", tenantId],
    queryFn: async () => {
      if (!tenantId) return null;

      const { data, error } = await supabase
        .from("tenant_settings")
        .select("settings_data")
        .eq("tenant_id", tenantId)
        .single();

      if (error) {
        // It's okay if no settings row is found, just return null.
        if (error.code === 'PGRST116') {
          return null;
        }
        // For other errors, re-throw.
        console.error("Error fetching tenant settings:", error);
        throw error;
      }

      return data?.settings_data || null;
    },
    enabled: !!tenantId,
  });
};

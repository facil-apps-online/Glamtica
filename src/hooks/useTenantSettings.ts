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
        .select("commercial_name")
        .eq("tenant_id", tenantId)
        .single();

      if (error) {
        console.error("Error fetching tenant settings:", error);
        throw error;
      }

      return data;
    },
    enabled: !!tenantId,
  });
};

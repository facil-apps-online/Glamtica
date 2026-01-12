import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface TenantSettings {
  tenant_id: string;
  settings_data: { [key: string]: any };
}

export const useSettings = () => {
  const { session, currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;
  const platformId = currentAssignment?.platform_id;

  return useQuery<TenantSettings["settings_data"], Error>({
    queryKey: ['tenantSettings', tenantId],
    queryFn: async () => {
      if (!tenantId || !session || !platformId) return {};

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/tenant-actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'get_tenant_settings',
          payload: { tenantId: tenantId, platformId: platformId },
        }),
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || 'Failed to fetch tenant settings');
      }
      return json.settings_data || {};
    },
    enabled: !!tenantId && !!session && !!platformId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};

export const useUpdateSetting = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { session, currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;
  const platformId = currentAssignment?.platform_id;

  return useMutation({
    mutationFn: async (newSettings: { [key: string]: any }) => {
      if (!tenantId || !session || !platformId) {
        console.error("Tenant ID, session or platformId is undefined when attempting to update settings.", { session, tenantId, platformId });
        throw new Error("Tenant ID, session or platformId not available");
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/tenant-actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'update_tenant_settings',
          payload: { tenantId: tenantId, newSettings: newSettings, platformId: platformId },
        }),
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || 'Failed to update tenant settings');
      }
      return json.settings_data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tenantSettings', tenantId] });
      toast({
        title: "Configuración actualizada",
        description: "Los cambios se han guardado correctamente.",
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo actualizar la configuración.",
        variant: "destructive",
      });
      console.error('Error updating setting:', error);
    },
  });
};
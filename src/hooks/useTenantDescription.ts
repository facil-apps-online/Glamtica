import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';

export const useUpdateTenantDescription = () => {
  const queryClient = useQueryClient();
  const { tenantId } = useAuth();

  return useMutation<any, Error, { description: string }>({
    mutationFn: async ({ description }) => {
      if (!tenantId) throw new Error("Tenant ID is required to update description.");

      const { data, error } = await supabase.functions.invoke('tenant-actions', {
        body: {
          action: 'update_tenant_description',
          payload: { description: description },
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenantSettingsData', tenantId] });
    },
  });
};

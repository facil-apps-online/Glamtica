import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext'; // Necesitamos importar useAuth
import { startOfDay, endOfDay } from 'date-fns'; // Import startOfDay and endOfDay

import { formatISO } from 'date-fns'; // Import formatISO from date-fns

// Interface for Time Off Request
export interface TimeOffRequest {
  id?: string;
  user_id: string;
  user_name?: string; // Nuevo campo para el nombre del usuario
  branch_id?: string; // Nuevo campo para el ID de la sucursal
  branch_name?: string; // Nuevo campo para el nombre de la sucursal
  start_date: Date;
  end_date: Date;
  type: string;
  reason?: string;
  status?: 'pending' | 'approved' | 'rejected';
  approved_by?: string | null;
  created_at?: string;
  is_partial_day?: boolean;
}

// Hook to fetch time off requests for a user
// Hook to fetch time off requests for a user or all users in a tenant
export const useUserTimeOff = (userId?: string, statusFilter?: TimeOffRequest['status'] | 'all' | TimeOffRequest['status'][], typeFilter?: string, dateRange?: { from?: Date; to?: Date }, branchId?: string, searchTerm?: string) => {
  const { currentAssignment, supabaseClient } = useAuth(); // Obtener el currentAssignment
  const tenantId = currentAssignment?.tenant_id;

  return useQuery<TimeOffRequest[], Error>({
    queryKey: ['user-time-off', userId, statusFilter, typeFilter, dateRange?.from, dateRange?.to, tenantId, branchId, searchTerm], // Añadir tenantId y branchId al queryKey // Añadir tenantId y branchId al queryKey
    queryFn: async () => {
      if (!tenantId) {
        throw new Error('Tenant ID is required to fetch time off requests.');
      }

      const payload = {
        tenantId,
        userId,
        statusFilter,
        typeFilter,
        dateRange,
        branchId,
        searchTerm,
      };

      const { data, error } = await supabaseClient.functions.invoke('tenant-actions', {
        body: {
          action: 'get_user_time_off_history',
          payload,
        },
      });

      if (error) throw new Error(error.message);

      return data.map((req: any) => ({
        ...req,
        start_date: new Date(req.start_date),
        end_date: new Date(req.end_date),
      })) as TimeOffRequest[];
    },
    enabled: !!tenantId,
  });
};

// Hook to create a new time off request
export const useCreateTimeOffRequest = () => {
  const queryClient = useQueryClient();
  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;

  return useMutation<TimeOffRequest, Error, Omit<TimeOffRequest, 'id' | 'created_at' | 'status' | 'approved_by' | 'approved_at' | 'notes' | 'branch_name'> & { is_partial_day: boolean }>({ // Añadido is_partial_day
    mutationFn: async (requestData) => {
      if (!tenantId) {
        throw new Error('Tenant ID is required to create a time off request.');
      }

      const { data, error } = await supabase
        .from('user_time_off')
        .insert([{ 
          user_id: requestData.user_id,
          start_date: requestData.start_date.toISOString(),
          end_date: requestData.end_date.toISOString(),
          type: requestData.type,
          reason: requestData.reason,
          status: 'pending',
          is_partial_day: requestData.is_partial_day, // Añadido is_partial_day
          tenant_id: tenantId,
          branch_id: requestData.branch_id, // Añadido branch_id
        }])
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      return { ...data, start_date: new Date(data.start_date), end_date: new Date(data.end_date) } as TimeOffRequest;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-time-off', variables.user_id] });
    },
  });
};

// Hook to update (approve/reject) a time off request
export const useUpdateTimeOffRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updateData: { id: string; status: 'approved' | 'rejected'; approved_by: string }) => {
      const { data, error } = await supabase
        .from('user_time_off')
        .update({ status: updateData.status, approved_by: updateData.approved_by })
        .eq('id', updateData.id)
        .select();
        
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      // Invalidate all time off queries as we don't know the user_id here
      queryClient.invalidateQueries({ queryKey: ['user-time-off'] });
    },
  });
};

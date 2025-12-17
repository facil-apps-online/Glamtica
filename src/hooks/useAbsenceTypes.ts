import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

// Interface for Absence Type
export interface AbsenceType {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
}

// Hook to fetch absence types
export const useGetAbsenceTypes = (showInactive = false) => {
  const { supabaseClient } = useAuth();

  return useQuery<AbsenceType[], Error>({
    queryKey: ['absence_types', showInactive],
    queryFn: async () => {
      const { data, error } = await supabaseClient.functions.invoke('tenant-actions', {
        body: {
          action: 'get_absence_types',
          payload: { showInactive },
        },
      });

      if (error) throw new Error(error.message);
      return data;
    },
  });
};

// Hook to create a new absence type
export const useCreateAbsenceType = () => {
  const queryClient = useQueryClient();
  const { supabaseClient } = useAuth();

  return useMutation<AbsenceType, Error, Omit<AbsenceType, 'id' | 'is_active'>>({
    mutationFn: async (absenceTypeData) => {
      const { data, error } = await supabaseClient.functions.invoke('tenant-actions', {
        body: {
          action: 'create_absence_type',
          payload: absenceTypeData,
        },
      });

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['absence_types'] });
    },
  });
};

// Hook to update an absence type
export const useUpdateAbsenceType = () => {
  const queryClient = useQueryClient();
  const { supabaseClient } = useAuth();

  return useMutation<AbsenceType, Error, Partial<AbsenceType> & { id: string }>({
    mutationFn: async (absenceTypeData) => {
      const { data, error } = await supabaseClient.functions.invoke('tenant-actions', {
        body: {
          action: 'update_absence_type',
          payload: absenceTypeData,
        },
      });

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['absence_types'] });
    },
  });
};

// Hook to delete an absence type (deactivate)
export const useDeleteAbsenceType = () => {
  const queryClient = useQueryClient();
  const { supabaseClient } = useAuth();

  return useMutation<AbsenceType, Error, string>({
    mutationFn: async (id) => {
      const { data, error } = await supabaseClient.functions.invoke('tenant-actions', {
        body: {
          action: 'delete_absence_type',
          payload: { id },
        },
      });

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['absence_types'] });
    },
  });
};

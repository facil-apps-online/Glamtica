
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

export interface SystemAlert {
  id: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const fetchSystemAlerts = async (): Promise<SystemAlert[]> => {
  const { data, error } = await supabase
    .from('system_alerts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

const createSystemAlert = async (alert: Omit<SystemAlert, 'id' | 'created_at' | 'updated_at'>): Promise<SystemAlert> => {
  const { data, error } = await supabase
    .from('system_alerts')
    .insert([alert])
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

const updateSystemAlert = async (alert: Partial<SystemAlert> & { id: string }): Promise<SystemAlert> => {
  const { data, error } = await supabase
    .from('system_alerts')
    .update(alert)
    .eq('id', alert.id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

const deleteSystemAlert = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('system_alerts')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }
};

export const useSystemAlerts = () => {
  return useQuery<SystemAlert[], Error>({
    queryKey: ['system_alerts'],
    queryFn: fetchSystemAlerts,
  });
};

export const useCreateSystemAlert = () => {
  const queryClient = useQueryClient();
  return useMutation<SystemAlert, Error, Omit<SystemAlert, 'id' | 'created_at' | 'updated_at'>>({
    mutationFn: createSystemAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system_alerts'] });
    },
  });
};

export const useUpdateSystemAlert = () => {
  const queryClient = useQueryClient();
  return useMutation<SystemAlert, Error, Partial<SystemAlert> & { id: string }>({
    mutationFn: updateSystemAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system_alerts'] });
    },
  });
};

export const useDeleteSystemAlert = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: deleteSystemAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system_alerts'] });
    },
  });
};

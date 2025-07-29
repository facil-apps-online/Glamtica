
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";

interface ServiceCommission {
  id: string;
  service_id: string;
  user_id: string;
  commission_rate: number;
  created_at: string;
  updated_at: string;
  services?: {
    id: string;
    name: string;
    price: number;
  };
  users?: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

interface CreateServiceCommissionData {
  service_id: string;
  user_id: string;
  branch_id: string;
  commission_rate: number;
}

export const useServiceCommissions = (serviceId?: string, branchId?: string) => {
  return useQuery({
    queryKey: ['service-commissions', serviceId, branchId],
    queryFn: async () => {
      let query = supabase
        .from('service_user_commissions')
        .select(`*, services(id, name, price), users(id, first_name, last_name)`)
        .order('created_at', { ascending: false });

      if (serviceId) query = query.eq('service_id', serviceId);
      if (branchId) query = query.eq('branch_id', branchId);

      const { data, error } = await query;
      if (error) throw error;
      return data as ServiceCommission[];
    },
    enabled: !!branchId,
  });
};

export const useUserServiceCommissions = (userId: string) => {
  return useQuery({
    queryKey: ['service-commissions', 'user', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_user_commissions')
        .select(`*, services(id, name, price, duration_minutes)`)
        .eq('user_id', userId)
        .order('services(name)');

      if (error) throw error;
      return data as ServiceCommission[];
    },
    enabled: !!userId,
  });
};

export const useCreateServiceCommission = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateServiceCommissionData) => {
      const { data: result, error } = await supabase
        .from('service_user_commissions')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-commissions'] });
      toast({ title: "Comisión agregada" });
    },
    onError: (error) => {
      toast({ title: "Error", description: "No se pudo agregar la comisión.", variant: "destructive" });
    },
  });
};

export const useUpdateServiceCommission = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<CreateServiceCommissionData> }) => {
      const { data, error } = await supabase
        .from('service_user_commissions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-commissions'] });
      toast({ title: "Comisión actualizada" });
    },
    onError: (error) => {
      toast({ title: "Error", description: "No se pudo actualizar la comisión.", variant: "destructive" });
    },
  });
};

export const useDeleteServiceCommission = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('service_user_commissions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-commissions'] });
      toast({ title: "Comisión eliminada" });
    },
    onError: (error) => {
      toast({ title: "Error", description: "No se pudo eliminar la comisión.", variant: "destructive" });
    },
  });
};

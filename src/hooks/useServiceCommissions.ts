
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";

// Helper to call the tenant-actions Edge Function
const callTenantAction = async (action: string, payload: any) => {
  const { data, error } = await supabase.functions.invoke('tenant-actions', {
    body: { action, payload },
  });
  if (error) throw error;
  return data;
};

// Main interface for a service commission
interface ServiceCommission {
  id: string;
  service_id: string;
  user_id: string;
  commission_rate: number;
  can_perform: boolean;
  created_at: string;
  updated_at: string;
  services?: {
    id: string;
    name: string;
  };
}

// Interface for creating a new service commission
interface CreateServiceCommissionData {
  service_id: string;
  user_id: string;
  branch_id: string;
  commission_rate: number;
  can_perform?: boolean;
}

// Hook to get all commissions for a specific service and branch
export const useServiceCommissions = (serviceId?: string, branchId?: string) => {
  return useQuery<ServiceCommission[], Error>({
    queryKey: ['service-commissions', serviceId, branchId],
    queryFn: () => callTenantAction('get_service_commissions_by_service_and_branch', { serviceId, branchId }),
    enabled: !!serviceId && !!branchId,
  });
};

// Hook to get all commissions for a specific user
export const useUserServiceCommissions = (userId: string) => {
  return useQuery<ServiceCommission[], Error>({
    queryKey: ['service-commissions', 'user', userId],
    queryFn: () => callTenantAction('get_user_service_commissions', { userId }),
    enabled: !!userId,
  });
};

// Mutation to create a new service commission
export const useCreateServiceCommission = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<ServiceCommission, Error, CreateServiceCommissionData>({
    mutationFn: (commissionData) => 
      callTenantAction('create_service_commission', { commissionData }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-commissions'] });
      toast({ title: "Comisión agregada", variant: "success" });
    },
    onError: (error) => {
      toast({ title: "Error", description: `No se pudo agregar la comisión: ${error.message}`, variant: "destructive" });
    },
  });
};

// Mutation to update an existing service commission
export const useUpdateServiceCommission = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<ServiceCommission, Error, { id: string; updates: Partial<CreateServiceCommissionData> }>({
    mutationFn: ({ id, updates }) => 
      callTenantAction('update_service_commission', { id, updates }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-commissions'] });
      toast({ title: "Comisión actualizada", variant: "success" });
    },
    onError: (error) => {
      toast({ title: "Error", description: `No se pudo actualizar la comisión: ${error.message}`, variant: "destructive" });
    },
  });
};

// Mutation to delete a service commission
export const useDeleteServiceCommission = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<{ success: boolean }, Error, string>({
    mutationFn: (id) => 
      callTenantAction('delete_service_commission', { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-commissions'] });
      toast({ title: "Comisión eliminada", variant: "success" });
    },
    onError: (error) => {
      toast({ title: "Error", description: `No se pudo eliminar la comisión: ${error.message}`, variant: "destructive" });
    },
  });
};

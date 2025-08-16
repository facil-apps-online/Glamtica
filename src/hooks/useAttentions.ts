import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useBranchFilterStore } from "@/stores/branchFilterStore";
import { Tables } from "@/integrations/supabase/types";
import { callTenantAction } from "@/lib/tenantActions";

// TODO: Definir interfaces más detalladas para Attention, AttentionService, etc.
export type Attention = Tables<'attentions'> & {
  clients: Tables<'clients'>;
  attention_services: (Tables<'attention_services'> & {
    services: Tables<'services'>;
    users: Tables<'users'>;
  })[];
  attention_products: (Tables<'attention_products'> & {
    products: Tables<'products'>;
  })[];
};

interface CreateAttentionParams {
  client_id: string;
  attention_date: string;
  attention_time: string;
  notes?: string;
  services: {
    service_id: string;
    user_id: string;
    service_price: number;
    notes?: string;
  }[];
}

export const useAttentions = (userId?: string, statusFilter?: string, dateFilter?: Date) => {
  const { currentAssignment } = useAuth();
  const { selectedBranchId } = useBranchFilterStore();
  const tenantId = currentAssignment?.tenant_id;

  return useQuery<Attention[], Error>({
    queryKey: ['attentions', tenantId, selectedBranchId, userId, statusFilter, dateFilter],
    queryFn: () => callTenantAction('get_attentions', { 
      branchId: selectedBranchId, 
      userId, 
      statusFilter, 
      dateFilter: dateFilter ? dateFilter.toISOString().split('T')[0] : undefined 
    }),
    enabled: !!tenantId,
  });
};

export const useAttentionDates = (userId?: string) => {
  const { currentAssignment } = useAuth();
  const { selectedBranchId } = useBranchFilterStore();
  const tenantId = currentAssignment?.tenant_id;

  return useQuery<Record<string, Set<string>>, Error>({
    queryKey: ['attention-dates', tenantId, selectedBranchId, userId],
    queryFn: async () => {
      if (!tenantId) return {};
      
      const data = await callTenantAction('get_attention_dates', { 
        branchId: selectedBranchId, 
        userId 
      });

      const datesByStatus = (data || []).reduce((acc, { attention_date, status }) => {
        if (attention_date) {
            if (!acc[attention_date]) {
              acc[attention_date] = new Set();
            }
            acc[attention_date].add(status);
        }
        return acc;
      }, {} as Record<string, Set<string>>);

      return datesByStatus;
    },
    enabled: !!tenantId,
  });
};


// --- MUTATIONS ---

export const useCreateAttention = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { currentAssignment } = useAuth();
  const { selectedBranchId } = useBranchFilterStore();

  return useMutation({
    mutationFn: async (params: CreateAttentionParams) => {
      if (!currentAssignment || !selectedBranchId || selectedBranchId === 'all') {
        throw new Error("No se ha seleccionado una sucursal válida.");
      }

      return callTenantAction('create_full_attention', {
        p_client_id: params.client_id,
        p_attention_date: params.attention_date,
        p_attention_time: params.attention_time,
        p_notes: params.notes,
        p_services: JSON.stringify(params.services),
        p_tenant_id: currentAssignment.tenant_id,
        p_branch_id: selectedBranchId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attentions'] });
      queryClient.invalidateQueries({ queryKey: ['attention-dates'] });
      toast({ title: "Atención creada", description: "La atención ha sido creada exitosamente." });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });
};

export const useCancelAttention = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: (attentionId: string) => callTenantAction('cancel_attention', { attentionId }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['attentions'] });
            queryClient.invalidateQueries({ queryKey: ['attention-dates'] });
            toast({
                title: 'Atención Cancelada',
                description: 'La atención ha sido cancelada correctamente.',
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Error al cancelar',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
};
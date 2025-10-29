import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useBranchFilterStore } from "@/stores/branchFilterStore";
import { Tables } from "@/integrations/supabase/types";
import { callTenantAction } from "@/lib/tenantActions";

export type AttentionService = Tables<'attention_services'> & {
  services: Tables<'services'>;
  users: Tables<'users'>;
  combo_id: string | null;
  status_history: {
    status: string;
    created_at: string;
  }[];
};

export type Attention = Tables<'attentions'> & {
  clients: Tables<'clients'>;
  attention_datetime: string;
  attention_services: AttentionService[];
  attention_products: (Tables<'attention_products'> & {
    products: Tables<'products'>;
    users: Tables<'users'>;
    combo_id: string | null;
  })[];
  attention_combos: (Tables<'attention_combos'> & {
    combos: (Tables<'combos'> & {
      combo_items: (Tables<'combo_items'> & {
        services: Tables<'services'> | null;
        products: Tables<'products'> | null;
      })[];
    });
    users: Tables<'users'>;
  })[];
  attention_payments: Tables<'attention_payments'>[];
};

interface CreateAttentionParams {
  p_client_id: string;
  p_attention_datetime: string; // Changed from date and time to a single datetime string
  p_notes: string | null;
  p_services: any[];
  p_products: any[];
  p_combos: any[];
  p_branch_id: string; // branch_id is required
  p_total_amount: number;
}

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

export const useAttentions = (userId?: string, statusFilter?: string, dateRange?: DateRange) => {
  const { currentAssignment } = useAuth();
  const { selectedBranchId } = useBranchFilterStore();
  const tenantId = currentAssignment?.tenant_id;

  const formatDate = (date: Date | undefined) => {
    if (!date) return undefined;
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      return undefined;
    }
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  return useQuery<Attention[], Error>({
    queryKey: ['attentions', tenantId, selectedBranchId, userId, statusFilter, dateRange],
    queryFn: async () => {
      const data = await callTenantAction('get_attentions', { 
        branchId: selectedBranchId, 
        userId, 
        statusFilter, 
        dateRange: {
          from: formatDate(dateRange?.from),
          to: formatDate(dateRange?.to)
        }
      });
      return data;
    },
    select: (data) => {
      if (!data) return [];
      return data.map(att => ({
        ...att,
        attention_combos: att.attention_combos || [],
        attention_products: att.attention_products || [],
        attention_services: att.attention_services || [],
      }));
    },
    enabled: !!tenantId && !!dateRange?.from && !!dateRange?.to,
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
      
      // Ensure a valid branch_id is always passed, using 'all' as the convention for no specific branch.
      const branchIdToSend = selectedBranchId || 'all';

      const data = await callTenantAction('get_attention_datetimes', { 
        p_branch_id: branchIdToSend, 
        p_user_id: userId 
      });

      const datesByStatus = (data || []).reduce((acc, { attention_datetime, status }) => {
        if (attention_datetime) {
            const dateStr = attention_datetime.split('T')[0];
            if (!acc[dateStr]) {
              acc[dateStr] = new Set();
            }
            acc[dateStr].add(status);
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

      const response = await callTenantAction('create_full_attention', {
        p_client_id: params.p_client_id,
        p_attention_datetime: params.p_attention_datetime,
        p_notes: params.p_notes,
        p_services: params.p_services,
        p_products: params.p_products,
        p_combos: params.p_combos,
        p_tenant_id: currentAssignment?.tenant_id,
        p_branch_id: params.p_branch_id,
        p_total_amount: params.p_total_amount,
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attentions'] });
      queryClient.invalidateQueries({ queryKey: ['attention-dates'] });
      toast({ title: "Atención creada", description: "La atención ha sido creada exitosamente.", variant: "success" });
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
                variant: "success"
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
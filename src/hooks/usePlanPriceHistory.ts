import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

export interface PlanPriceHistory {
  id: string;
  subscription_plan_id: string;
  base_price_cop: number;
  extra_branch_price_cop: number;
  effective_date: string;
  created_at: string;
  subscription_plans: { name: string }; // Para mostrar el nombre del plan
}

// GET all price history records
const fetchAllPriceHistory = async (): Promise<PlanPriceHistory[]> => {
  const { data, error } = await supabase
    .from('plan_price_history')
    .select('*, subscription_plans(name)')
    .order('effective_date', { ascending: false });

  if (error) throw new Error(error.message);
  return data as PlanPriceHistory[];
};

export const useAllPlanPriceHistory = () => {
  return useQuery<PlanPriceHistory[], Error>({
    queryKey: ['plan_price_history_all'],
    queryFn: fetchAllPriceHistory,
  });
};

// CREATE a new price history record
const createPlanPrice = async (priceData: Omit<PlanPriceHistory, 'id' | 'created_at' | 'subscription_plans'>): Promise<PlanPriceHistory> => {
  const { data, error } = await supabase
    .from('plan_price_history')
    .insert([priceData])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};

export const useCreatePlanPrice = () => {
  const queryClient = useQueryClient();
  return useMutation<PlanPriceHistory, Error, Omit<PlanPriceHistory, 'id' | 'created_at' | 'subscription_plans'>>({
    mutationFn: createPlanPrice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plan_price_history_all'] });
      queryClient.invalidateQueries({ queryKey: ['calculated_prices'] });
    },
  });
};

// DELETE a plan price history record
const deletePlanPrice = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('plan_price_history')
    .delete()
    .match({ id });

  if (error) throw new Error(error.message);
};

export const useDeletePlanPrice = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: deletePlanPrice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plan_price_history_all'] });
      queryClient.invalidateQueries({ queryKey: ['calculated_prices'] });
    },
  });
};
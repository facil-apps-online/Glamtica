
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  billing_frequency_months: number;
  display_order: number;
}

// GET all plans
const fetchSubscriptionPlans = async (): Promise<SubscriptionPlan[]> => {
  const { data, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) throw new Error(error.message);
  return data;
};

export const useSubscriptionPlans = () => {
  return useQuery<SubscriptionPlan[], Error>({
    queryKey: ['subscription_plans'],
    queryFn: fetchSubscriptionPlans,
  });
};

// GET plan by ID
const fetchSubscriptionPlanById = async (id: string): Promise<SubscriptionPlan> => {
  const { data, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return data;
};

export const useSubscriptionPlanById = (id: string) => {
  return useQuery<SubscriptionPlan, Error>({
    queryKey: ['subscription_plan', id],
    queryFn: () => fetchSubscriptionPlanById(id),
    enabled: !!id,
  });
};

// CREATE plan
const createSubscriptionPlan = async (plan: Omit<SubscriptionPlan, 'id' | 'created_at' | 'updated_at'>): Promise<SubscriptionPlan> => {
  const { data, error } = await supabase
    .from('subscription_plans')
    .insert([plan])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};

export const useCreateSubscriptionPlan = () => {
  const queryClient = useQueryClient();
  return useMutation<SubscriptionPlan, Error, Omit<SubscriptionPlan, 'id' | 'created_at' | 'updated_at'>>({
    mutationFn: createSubscriptionPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription_plans'] });
    },
  });
};

// UPDATE plan
const updateSubscriptionPlan = async ({ id, ...plan }: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> => {
  const { data, error } = await supabase
    .from('subscription_plans')
    .update(plan)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};

export const useUpdateSubscriptionPlan = () => {
  const queryClient = useQueryClient();
  return useMutation<SubscriptionPlan, Error, Partial<SubscriptionPlan>>({
    mutationFn: updateSubscriptionPlan,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['subscription_plans'] });
      queryClient.invalidateQueries({ queryKey: ['subscription_plan', data.id] });
    },
  });
};

// DELETE plan
const deleteSubscriptionPlan = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('subscription_plans')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
};

export const useDeleteSubscriptionPlan = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: deleteSubscriptionPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription_plans'] });
    },
  });
};


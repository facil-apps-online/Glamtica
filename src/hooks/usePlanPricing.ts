import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

// --- Tipos ---
export interface TariffAssetPrice {
  id: string;
  tariff_id: string;
  asset_id: string;
  extra_unit_price: number;
  overage_unit_price: number;
}

export interface PriceTariff {
  id: string;
  subscription_plan_id: string;
  effective_date: string;
  base_price: number;
  currency_id: string;
  asset_prices: TariffAssetPrice[];
}

export interface NewTariffData {
  subscription_plan_id: string;
  effective_date: string;
  base_price: number;
  currency_id: string;
}

export interface NewAssetPriceData {
  asset_id: string;
  extra_unit_price: number;
  overage_unit_price: number;
}

// --- Hook ---
export const usePlanPricing = (planId: string) => {
  const queryClient = useQueryClient();

  // 1. Query para obtener las tarifas del plan
  const { data: tariffs = [], isLoading: isLoadingTariffs } = useQuery<PriceTariff[]>({
    queryKey: ['tariffs', planId],
    queryFn: async () => {
      if (!planId) return [];
      const { data, error } = await supabase.functions.invoke('superadmin-actions', {
        body: { action: 'get_tariffs_for_plan', payload: { planId } },
      });
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!planId,
  });

  // 2. Mutation para programar una nueva tarifa
  const { mutate: scheduleNewTariff, isPending: isScheduling } = useMutation({
    mutationFn: async (variables: { tariffData: NewTariffData, assetPricesData: NewAssetPriceData[] }) => {
      const { error } = await supabase.functions.invoke('superadmin-actions', {
        body: { 
          action: 'schedule_new_tariff', 
          payload: { 
            tariffData: variables.tariffData,
            assetPricesData: variables.assetPricesData
          } 
        },
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tariffs', planId] });
    },
  });

  return {
    tariffs,
    isLoadingTariffs,
    scheduleNewTariff,
    isScheduling,
  };
};

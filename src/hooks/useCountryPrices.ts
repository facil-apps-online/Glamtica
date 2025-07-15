
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

export interface CountryPrice {
  id?: string;
  country_id: string;
  subscription_plan_id: string;
  price: number;
  currency_id: string;
}

// GET all prices for a specific country
const fetchPricesByCountry = async (countryId: string): Promise<CountryPrice[]> => {
  if (!countryId) return [];
  const { data, error } = await supabase
    .from('country_subscription_prices')
    .select('*')
    .eq('country_id', countryId);

  if (error) throw new Error(error.message);
  return data;
};

export const useCountryPrices = (countryId: string) => {
  return useQuery<CountryPrice[], Error>({
    queryKey: ['country_prices', countryId],
    queryFn: () => fetchPricesByCountry(countryId),
    enabled: !!countryId,
  });
};

// UPSERT (Create or Update) a price
const upsertCountryPrice = async (priceData: CountryPrice): Promise<CountryPrice> => {
  const { data, error } = await supabase
    .from('country_subscription_prices')
    .upsert({
        // Si el id existe, se actualizará. Si no, se creará uno nuevo.
        // El 'id' se maneja en la UI para diferenciar entre crear y actualizar.
        id: priceData.id, 
        country_id: priceData.country_id,
        subscription_plan_id: priceData.subscription_plan_id,
        price: priceData.price,
        currency_id: priceData.currency_id,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};

export const useUpsertCountryPrice = () => {
  const queryClient = useQueryClient();
  return useMutation<CountryPrice, Error, CountryPrice>({
    mutationFn: upsertCountryPrice,
    onSuccess: (data) => {
      // Refrescar la lista de precios para el país afectado
      queryClient.invalidateQueries({ queryKey: ['country_prices', data.country_id] });
    },
  });
};

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchTenantAction } from "@/lib/fetchTenantAction";
import { ServiceTaxType } from "@/types/services";

interface AddServiceTaxTypePayload {
  service_id: string;
  tax_type_id: string;
}

interface RemoveServiceTaxTypePayload {
  id: string;
}

export const useServiceTaxTypes = (serviceId: string) => {
  return useQuery<ServiceTaxType[], Error>({
    queryKey: ['serviceTaxTypes', serviceId],
    queryFn: async () => {
      const data = await fetchTenantAction('get_service_tax_types', { service_id: serviceId });
      return data as ServiceTaxType[];
    },
    enabled: !!serviceId,
  });
};

export const useAddServiceTaxType = () => {
  const queryClient = useQueryClient();
  return useMutation<ServiceTaxType, Error, AddServiceTaxTypePayload>({
    mutationFn: async (payload) => {
      const data = await fetchTenantAction('add_service_tax_type', payload);
      return data as ServiceTaxType;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceTaxTypes'] });
    },
  });
};

export const useRemoveServiceTaxType = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, RemoveServiceTaxTypePayload>({
    mutationFn: async (payload) => {
      await fetchTenantAction('remove_service_tax_type', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceTaxTypes'] });
    },
    onError: (error) => {
      console.error("Error removing service tax type:", error);
    },
  });
};
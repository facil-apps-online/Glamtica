import { useQuery } from "@tanstack/react-query";
import { fetchTenantAction } from "@/lib/fetchTenantAction";
import { useAuth } from "@/contexts/AuthContext";

export interface SelectableItem {
  id: string;
  name: string;
  type: 'product' | 'service';
}

// Hook para obtener productos maestros seleccionables
export const useSelectableProducts = (searchTerm?: string) => {
  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;

  return useQuery<SelectableItem[], Error>({
    queryKey: ['selectable_products', tenantId, searchTerm],
    queryFn: async () => {
      const products = await fetchTenantAction('get_master_products', { 
        searchTerm, 
        showInactive: false, // Solo activos para selección
        categoryId: null, 
        brandId: null 
      });
      return products.map((p: any) => ({
        id: p.id,
        name: `${p.name} (SKU: ${p.sku || 'N/A'})`, // Formato para mostrar más info
        type: 'product',
      }));
    },
    enabled: !!tenantId,
  });
};

// Hook para obtener servicios maestros seleccionables
export const useSelectableServices = (searchTerm?: string) => {
  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;

  return useQuery<SelectableItem[], Error>({
    queryKey: ['selectable_services', tenantId, searchTerm],
    queryFn: async () => {
      const services = await fetchTenantAction('get_master_services', { 
        searchTerm, 
        showInactive: false, // Solo activos para selección
        categoryId: null 
      });
      return services.map((s: any) => ({
        id: s.id,
        name: s.name,
        type: 'service',
      }));
    },
    enabled: !!tenantId,
  });
};

// Hook combinado para obtener productos y servicios seleccionables
export const useSelectableProductServices = (searchTerm: string = '') => {
  const { data: products, isLoading: isLoadingProducts } = useSelectableProducts(searchTerm);
  const { data: services, isLoading: isLoadingServices } = useSelectableServices(searchTerm);

  const combinedData = (products || []).concat(services || []);
  combinedData.sort((a, b) => a.name.localeCompare(b.name));

  return {
    data: combinedData,
    isLoading: isLoadingProducts || isLoadingServices,
  };
};

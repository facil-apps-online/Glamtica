import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";

// --- INTERFACES ---
export interface BranchCommissionData {
  products: {
    product_id: string;
    product_name: string;
    users: {
      user_id: string;
      user_name: string;
      commission_rate: number | null;
      commission_id: string | null;
    }[];
  }[];
  services: {
    service_id: string;
    service_name: string;
    users: {
      user_id: string;
      user_name: string;
      commission_rate: number | null;
      can_perform: boolean | null; // Relevant for services
      commission_id: string | null;
    }[];
  }[];
}

// --- HELPERS ---
const callTenantAction = async (action: string, payload: any) => {
  const { data, error } = await supabase.functions.invoke('tenant-actions', {
    body: { action, payload },
  });
  if (error) throw error;
  return data;
};

// --- HOOK ---
/**
 * Hook para obtener la matriz de comisiones de una sucursal específica.
 * Devuelve, para una sucursal dada, todos los productos y servicios activos
 * y las comisiones que tienen los usuarios para ellos en esa sucursal.
 * @param branchId - El ID de la sucursal.
 */
export const useBranchCommissionData = (branchId?: string) => {
  return useQuery<BranchCommissionData, Error>({
    queryKey: ['branch_commission_data', branchId],
    queryFn: async () => {
      const rawData = await callTenantAction('get_branch_commission_matrix', { branchId });
      
      // Transform the flat array returned by the RPC into the nested structure expected by the frontend
      const transformedData: BranchCommissionData = {
        products: [],
        services: [],
      };

      if (Array.isArray(rawData)) {
        rawData.forEach(item => {
          if (item.item_type === 'product') {
            transformedData.products.push({
              product_id: item.item_id,
              product_name: item.item_name,
              users: item.users || [],
            });
          } else if (item.item_type === 'service') {
            transformedData.services.push({
              service_id: item.item_id,
              service_name: item.item_name,
              users: item.users || [],
            });
          }
        });
      }
      
      return transformedData;
    },
    enabled: !!branchId,
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
  });
};

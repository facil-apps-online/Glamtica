import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";

// --- INTERFACES ---
// Estructura de datos que el hook devolverá
export interface ProductCommissionData {
  user_id: string;
  user_name: string;
  branches: {
    branch_id: string;
    branch_name: string;
    commission_rate: number | null;
    commission_id: string | null;
  }[];
}

export interface TransformedProductCommissionData {
  branch_id: string;
  branch_name: string;
  users: {
    user_id: string;
    user_name: string;
    commission_rate: number | null;
    commission_id: string | null;
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
 * Hook para obtener la matriz de comisiones de un producto específico.
 * Devuelve, para un producto dado, todos los usuarios que pueden venderlo
 * y la comisión que tienen en cada sucursal donde el producto está disponible.
 * @param productId - El ID del producto maestro.
 * @param branchId - El ID de la sucursal para filtrar los resultados.
 */
export const useProductCommissionData = (productId?: string, branchId?: string) => {
  return useQuery<TransformedProductCommissionData[], Error>({
    queryKey: ['product_commission_data', productId, branchId],
    queryFn: async () => {
      const rawCommissionData: ProductCommissionData[] = await callTenantAction('get_product_commission_matrix', { productId, branchId });

      const transformedDataMap = new Map<string, TransformedProductCommissionData>();

      rawCommissionData.forEach(userData => {
        userData.branches.forEach(branchData => {
          // Only process branches that match the provided branchId, if branchId is provided
          if (branchId && branchData.branch_id !== branchId) {
            return; 
          }
          if (!transformedDataMap.has(branchData.branch_id)) {
            transformedDataMap.set(branchData.branch_id, {
              branch_id: branchData.branch_id,
              branch_name: branchData.branch_name,
              users: []
            });
          }
          transformedDataMap.get(branchData.branch_id)?.users.push({
            user_id: userData.user_id,
            user_name: `${userData.first_name} ${userData.last_name}`,
            commission_rate: branchData.commission_rate,
            commission_id: branchData.commission_id,
          });
        });
      });

      // Sort branches by name for consistent display
      const sortedTransformedData = Array.from(transformedDataMap.values()).sort((a, b) =>
        a.branch_name.localeCompare(b.branch_name)
      );

      return sortedTransformedData;
    },
    enabled: !!productId,
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
  });
};

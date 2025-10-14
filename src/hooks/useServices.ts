import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useBranchFilterStore } from "@/stores/branchFilterStore";
import { MasterService, BranchService } from "@/types/services";

// --- HELPERS ---

const callTenantAction = async (action: string, payload: any) => {
  const { data, error } = await supabase.functions.invoke('tenant-actions', {
    body: { action, payload },
  });
  if (error) throw error;
  return data;
};

// --- HOOKS ---

// Hook para obtener los servicios disponibles en la sucursal seleccionada
export const useBranchServicesAndCombos = (branchIdParam?: string, searchTerm?: string) => {
  const { selectedBranchId } = useBranchFilterStore();
  const { currentAssignment } = useAuth();
  const branchIdToUse = branchIdParam || selectedBranchId;

  return useQuery<(BranchService & { type: 'service' | 'combo' })[], Error>({
    queryKey: ['branch_services_and_combos', branchIdToUse, searchTerm, currentAssignment?.assignment_id],
    queryFn: async () => {
      if (!branchIdToUse || (branchIdToUse === 'all' && currentAssignment?.role_name === 'tenant_super_admin')) {
        return [];
      }

      const [services, combos] = await Promise.all([
        callTenantAction('get_branch_services', { branchId: branchIdToUse, searchTerm }),
        callTenantAction('get_combos_for_branch', { branchId: branchIdToUse, searchTerm })
      ]);

      const formattedServices = services.map((s: BranchService) => ({ ...s, type: 'service' }));
      const formattedCombos = combos.map((combo: any) => {
        const items = Array.isArray(combo.items) ? combo.items : [];

        const totalPrice = items.reduce((acc: number, item: any) => {
          const price = item.final_price || item.base_price || 0;
          const quantity = item.quantity || 1;
          return acc + (price * quantity);
        }, 0);

        const totalDuration = items.reduce((acc: number, item: any) => {
            if (item.service_id) {
                const duration = item.duration_minutes || 0;
                const quantity = item.quantity || 1;
                return acc + (duration * quantity);
            }
            return acc;
        }, 0);

        return {
          id: combo.id,
          name: combo.name,
          description: combo.description,
          selling_price: totalPrice,
          duration_minutes: totalDuration,
          is_branch_active: combo.is_active_in_branch,
          type: 'combo',
          items: items // <-- AÑADIDO
        };
      });

      const combined = [...formattedServices, ...formattedCombos];
      
      combined.sort((a, b) => a.name.localeCompare(b.name));

      return combined;
    },
    enabled: !!branchIdToUse && (branchIdToUse !== 'all' || currentAssignment?.role_name !== 'tenant_super_admin'),
    keepPreviousData: true,
  });
};

// Hook para obtener todos los servicios maestros (el catálogo general)
export const useMasterServices = (searchTerm?: string, showInactive?: boolean, filterCategory?: string) => {
  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;

  return useQuery<MasterService[], Error>({
    queryKey: ['master_services', tenantId, searchTerm, showInactive, filterCategory],
    queryFn: () => callTenantAction('get_master_services', { searchTerm, showInactive, categoryId: filterCategory }),
    enabled: !!tenantId,
  });
};

// Hook para obtener los detalles de un servicio maestro
export const useMasterServiceDetails = (serviceId: string) => {
  return useQuery<MasterService, Error>({
    queryKey: ['master_service_details', serviceId],
    queryFn: () => callTenantAction('get_master_service_details', { serviceId }),
    enabled: !!serviceId,
  });
};

// Hook para obtener todos los combos maestros (el catálogo general)
export const useMasterCombos = () => {
  return useQuery<any[], Error>({ // TODO: Definir un tipo MasterCombo
    queryKey: ['master_combos'],
    queryFn: () => callTenantAction('get_master_combos', {}),
  });
};

// Hook para obtener los precios de un servicio maestro en todas sus sucursales
export const useServiceBranchPrices = (serviceId: string) => {
  return useQuery<BranchService[], Error>({
    queryKey: ['service_branch_prices', serviceId],
    queryFn: () => callTenantAction('get_service_branch_prices', { serviceId }),
    enabled: !!serviceId,
  });
};

// --- MUTATIONS ---

// Crear un nuevo servicio en el catálogo maestro
export const useCreateMasterService = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<MasterService, Error, Omit<MasterService, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>>({
    mutationFn: (serviceData) => 
      callTenantAction('create_master_service', { serviceData }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['master_services'] });
      toast({ title: "Servicio Maestro Creado", description: "El servicio ha sido añadido al catálogo general.", variant: "success" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
};

// Actualizar un servicio del catálogo maestro
export const useUpdateMasterService = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<MasterService, Error, { id: string; updates: Partial<MasterService> }>({
    mutationFn: ({ id, updates }) =>
      callTenantAction('update_master_service', { id, updates }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['master_services'] });
      queryClient.invalidateQueries({ queryKey: ['branch_services'] });
      // Invalidate the details query for this specific service
      queryClient.invalidateQueries({ queryKey: ['master_service_details', variables.id] });
      // Invalidate the chatter query for this specific service
      if (data && data.tenant_id && variables.id) {
        queryClient.invalidateQueries({ queryKey: ['chatter', 'services', variables.id, data.tenant_id] });
      }
      toast({ title: "Servicio Maestro Actualizado", description: "La información del servicio ha sido actualizada.", variant: "success" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
};

// Asignar un servicio a una o varias sucursales
export const useAssignServiceToBranch = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<any, Error, { service_id: string; branch_ids: string[]; defaults: { selling_price: number; duration_minutes?: number; is_active?: boolean } }>({
    mutationFn: (payload) =>
      callTenantAction('assign_service_to_branch', payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['branch_services'] });
      queryClient.invalidateQueries({ queryKey: ['service_branch_prices', variables.service_id] });
      toast({ title: "Asignación Exitosa", description: "El servicio ha sido asignado a la(s) sucursal(es).", variant: "success" });
    },
    onError: (error: Error) => {
      toast({ title: "Error de Asignación", description: error.message, variant: "destructive" });
    },
  });
};

// Actualizar un servicio en una sucursal específica
export const useUpdateBranchService = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<BranchService, Error, { id: string; updates: Partial<Omit<BranchService, 'id'>> }>({
    mutationFn: ({ id, updates }) =>
      callTenantAction('update_branch_service', { id, updates }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branch_services'] });
      toast({ title: "Servicio Actualizado", description: "El precio, duración o estado ha sido actualizado para esta sucursal.", variant: "success" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
};

// Desvincular un servicio de una sucursal
export const useRemoveServiceFromBranch = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<any, Error, string>({
    mutationFn: (branch_service_id) =>
      callTenantAction('remove_service_from_branch', { branch_service_id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branch_services'] });
      toast({ title: "Servicio Desvinculado", description: "El servicio ha sido removido de esta sucursal.", variant: "success" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
};

// Asignar un combo a una o varias sucursales
export const useAssignComboToBranch = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<any, Error, { combo_id: string; branch_id: string; selling_price: number; is_active?: boolean }>({
    mutationFn: ({ combo_id, branch_id, selling_price, is_active }) =>
      callTenantAction('assign_combo_to_branch', { combo_id, branch_id, selling_price, is_active }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['branch_services_and_combos'] });
      toast({ title: "Asignación Exitosa", description: "El combo ha sido asignado a la sucursal.", variant: "success" });
    },
    onError: (error: Error) => {
      toast({ title: "Error de Asignación", description: error.message, variant: "destructive" });
    },
  });
};

// Actualizar un combo en una sucursal específica
export const useUpdateBranchCombo = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<any, Error, { id: string; branchId: string; updates: { selling_price?: number; is_active_in_branch?: boolean } }>({
    mutationFn: ({ id, branchId, updates }) =>
      callTenantAction('update_branch_combo_status', { combo_id: id, branch_id: branchId, is_active: updates.is_active_in_branch }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['branch_services_and_combos', variables.branchId] });
      toast({ title: "Combo Actualizado", description: "El precio o estado ha sido actualizado para esta sucursal.", variant: "success" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
};

// Actualizar masivamente los precios de combos en una sucursal
export const useBulkUpdateBranchComboPrices = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<any, Error, { branchId: string; updates: { combo_id: string; selling_price: number }[] }>({
    mutationFn: (payload) =>
      callTenantAction('bulk_update_branch_combo_prices', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branch_services_and_combos'] });
      toast({ title: "Precios de Combos Actualizados", description: "Los precios de los combos han sido actualizados masivamente.", variant: "success" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
};

// Eliminar un servicio del catálogo maestro
export const useDeleteMasterService = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<any, Error, string>({
    mutationFn: (id) => callTenantAction('delete_master_service', { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['master_services'] });
      toast({ title: "Servicio Eliminado", description: "El servicio ha sido eliminado del catálogo general.", variant: "success" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
};
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
export const useBranchServices = (branchIdParam?: string) => {
  const { selectedBranchId } = useBranchFilterStore();
  const branchIdToUse = branchIdParam || selectedBranchId;

  return useQuery<BranchService[], Error>({
    queryKey: ['branch_services', branchIdToUse],
    queryFn: () => callTenantAction('get_branch_services', { branchId: branchIdToUse }),
    enabled: !!branchIdToUse && branchIdToUse !== 'all',
  });
};

// Hook para obtener todos los servicios maestros (el catálogo general)
export const useMasterServices = (searchTerm?: string, showInactive?: boolean, filterCategory?: string) => {
  return useQuery<MasterService[], Error>({
    queryKey: ['master_services', searchTerm, showInactive, filterCategory],
    queryFn: () => callTenantAction('get_master_services', { searchTerm, showInactive, categoryId: filterCategory }),
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
      toast({ title: "Servicio Maestro Creado", description: "El servicio ha sido añadido al catálogo general." });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['master_services'] });
      queryClient.invalidateQueries({ queryKey: ['branch_services'] });
      toast({ title: "Servicio Maestro Actualizado", description: "La información del servicio ha sido actualizada." });
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
      toast({ title: "Asignación Exitosa", description: "El servicio ha sido asignado a la(s) sucursal(es)." });
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
      toast({ title: "Servicio Actualizado", description: "El precio, duración o estado ha sido actualizado para esta sucursal." });
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
      toast({ title: "Servicio Desvinculado", description: "El servicio ha sido removido de esta sucursal." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
};
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { fetchTenantAction } from "@/lib/fetchTenantAction";
import type { TreatmentCategory } from "./useTreatments";

export const useTreatmentCategories = () => {
  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;

  return useQuery<TreatmentCategory[], Error>({
    queryKey: ['treatmentCategories', tenantId],
    queryFn: () => fetchTenantAction('get_treatment_categories', {}),
    enabled: !!tenantId,
  });
};

export const useCreateTreatmentCategory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;

  return useMutation<TreatmentCategory, Error, Omit<TreatmentCategory, 'id' | 'created_at' | 'updated_at' | 'is_active'>>({
    mutationFn: async (categoryData) => {
      if (!tenantId) throw new Error("Tenant ID not available");
      return fetchTenantAction('create_treatment_category', { ...categoryData });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treatmentCategories', tenantId] });
      toast({ title: "Categoría creada", description: "La categoría ha sido creada exitosamente.", variant: "success" });
    },
    onError: (error) => {
      toast({ title: "Error", description: `No se pudo crear la categoría: ${error.message}`, variant: "destructive" });
    },
  });
};

export const useUpdateTreatmentCategory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;

  return useMutation<TreatmentCategory, Error, { id: string; updates: Partial<TreatmentCategory> }>({
    mutationFn: async ({ id, updates }) => {
      if (!tenantId) throw new Error("Tenant ID not available");
      return fetchTenantAction('update_treatment_category', { id, ...updates });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treatmentCategories', tenantId] });
      toast({ title: "Categoría actualizada", description: "La categoría ha sido actualizada exitosamente.", variant: "success" });
    },
    onError: (error) => {
      toast({ title: "Error", description: `No se pudo actualizar la categoría: ${error.message}`, variant: "destructive" });
    },
  });
};

export const useDeleteTreatmentCategory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;

  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      if (!tenantId) throw new Error("Tenant ID not available");
      return fetchTenantAction('delete_treatment_category', { id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treatmentCategories', tenantId] });
      toast({ title: "Categoría eliminada", description: "La categoría ha sido eliminada exitosamente.", variant: "success" });
    },
    onError: (error) => {
      toast({ title: "Error", description: `No se pudo eliminar la categoría: ${error.message}`, variant: "destructive" });
    },
  });
};

export const useToggleTreatmentCategoryStatus = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;

  return useMutation<TreatmentCategory, Error, { id: string; is_active: boolean }>({
    mutationFn: async ({ id, is_active }) => {
      if (!tenantId) throw new Error("Tenant ID not available");
      return fetchTenantAction('toggle_treatment_category_status', { id, is_active });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['treatmentCategories', tenantId] });
      toast({
        title: data.is_active ? "Categoría activada" : "Categoría desactivada",
        description: `La categoría ha sido ${data.is_active ? 'activada' : 'desactivada'} exitosamente.`,
        variant: "success"
      });
    },
    onError: (error) => {
      toast({ title: "Error", description: `No se pudo cambiar el estado de la categoría: ${error.message}`, variant: "destructive" });
    },
  });
};

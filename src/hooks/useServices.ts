import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useBranchFilterStore } from "@/stores/branchFilterStore";

export interface Service {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration_minutes: number;
  is_active: boolean;
  category_id?: string;
  created_at: string;
  updated_at: string;
  service_categories?: {
    id: string;
    name: string;
    description?: string;
    is_active: boolean;
  };
}

// --- QUERIES REFACTORIZADAS ---

export const useServices = () => {
  const { currentAssignment } = useAuth();
  const { selectedBranchId } = useBranchFilterStore();
  const tenantId = currentAssignment?.tenant_id;

  return useQuery({
    queryKey: ['services', tenantId, selectedBranchId],
    queryFn: async () => {
      if (!tenantId) return [];

      let servicesQuery = supabase
        .from('services')
        .select('*')
        .eq('tenant_id', tenantId);

      if (selectedBranchId !== 'all') {
        servicesQuery = servicesQuery.eq('branch_id', selectedBranchId);
      }

      const { data: servicesData, error: servicesError } = await servicesQuery.order('name');
      if (servicesError) throw servicesError;

      const { data: categoriesData, error: categoriesError } = await supabase
        .from('service_categories')
        .select('*')
        .eq('tenant_id', tenantId);

      if (categoriesError) console.warn('Error fetching categories:', categoriesError);

      const servicesWithCategories = servicesData.map(service => {
        const category = categoriesData?.find(cat => cat.id === service.category_id);
        return { ...service, service_categories: category || undefined };
      });

      return servicesWithCategories as Service[];
    },
    enabled: !!tenantId,
  });
};

export const useActiveServices = () => {
  const { currentAssignment } = useAuth();
  const { selectedBranchId } = useBranchFilterStore();
  const tenantId = currentAssignment?.tenant_id;

  return useQuery({
    queryKey: ['services', 'active', tenantId, selectedBranchId],
    queryFn: async () => {
      if (!tenantId) return [];

      let servicesQuery = supabase
        .from('services')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', true);

      if (selectedBranchId !== 'all') {
        servicesQuery = servicesQuery.eq('branch_id', selectedBranchId);
      }

      const { data: servicesData, error: servicesError } = await servicesQuery.order('name');
      if (servicesError) throw servicesError;

      const { data: categoriesData, error: categoriesError } = await supabase
        .from('service_categories')
        .select('*')
        .eq('tenant_id', tenantId);

      if (categoriesError) console.warn('Error fetching categories:', categoriesError);

      const servicesWithCategories = servicesData.map(service => {
        const category = categoriesData?.find(cat => cat.id === service.category_id);
        return { ...service, service_categories: category || undefined };
      });

      return servicesWithCategories as Service[];
    },
    enabled: !!tenantId,
  });
};

// --- MUTACIONES RESTAURADAS ---

export const useCreateService = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;

  return useMutation({
    mutationFn: async (serviceData: Omit<Service, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('services')
        .insert([serviceData])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services', tenantId] });
      toast({ title: "Servicio creado", description: "El servicio ha sido creado exitosamente." });
    },
    onError: (error) => {
      toast({ title: "Error", description: "No se pudo crear el servicio.", variant: "destructive" });
      console.error('Error creating service:', error);
    },
  });
};

export const useUpdateService = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Service> }) => {
      const { data, error } = await supabase
        .from('services')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services', tenantId] });
      toast({ title: "Servicio actualizado", description: "El servicio ha sido actualizado exitosamente." });
    },
    onError: (error) => {
      toast({ title: "Error", description: "No se pudo actualizar el servicio.", variant: "destructive" });
      console.error('Error updating service:', error);
    },
  });
};

export const useToggleServiceStatus = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from('services')
        .update({ is_active })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['services', tenantId] });
      toast({
        title: data.is_active ? "Servicio activado" : "Servicio desactivado",
        description: `El servicio ha sido ${data.is_active ? 'activado' : 'desactivado'} exitosamente.`,
      });
    },
    onError: (error) => {
      toast({ title: "Error", description: "No se pudo cambiar el estado del servicio.", variant: "destructive" });
      console.error('Error toggling service status:', error);
    },
  });
};

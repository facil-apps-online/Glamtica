import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";

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

export const useServices = () => {
  return useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .order('name');

      if (servicesError) {
        throw servicesError;
      }

      const { data: categoriesData, error: categoriesError } = await supabase
        .from('service_categories')
        .select('*');

      if (categoriesError) {
        console.warn('Error fetching categories:', categoriesError);
      }

      const servicesWithCategories = servicesData.map(service => {
        const category = categoriesData?.find(cat => cat.id === service.category_id);
        return {
          ...service,
          service_categories: category ? {
            id: category.id,
            name: category.name,
            description: category.description,
            is_active: category.is_active
          } : undefined
        };
      });

      return servicesWithCategories as Service[];
    },
  });
};

export const useActiveServices = () => {
  return useQuery({
    queryKey: ['services', 'active'],
    queryFn: async () => {
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (servicesError) {
        throw servicesError;
      }

      const { data: categoriesData, error: categoriesError } = await supabase
        .from('service_categories')
        .select('*');

      if (categoriesError) {
        console.warn('Error fetching categories:', categoriesError);
      }

      const servicesWithCategories = servicesData.map(service => {
        const category = categoriesData?.find(cat => cat.id === service.category_id);
        return {
          ...service,
          service_categories: category ? {
            id: category.id,
            name: category.name,
            description: category.description,
            is_active: category.is_active
          } : undefined
        };
      });

      return servicesWithCategories as Service[];
    },
  });
};

export const useCreateService = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (serviceData: {
      name: string;
      description?: string;
      price: number;
      duration_minutes: number;
      category_id?: string;
      is_active?: boolean;
    }) => {
      const { data, error } = await supabase
        .from('services')
        .insert([serviceData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast({
        title: "Servicio creado",
        description: "El servicio ha sido creado exitosamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo crear el servicio. Inténtalo de nuevo.",
        variant: "destructive",
      });
      console.error('Error creating service:', error);
    },
  });
};

export const useUpdateService = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      id, 
      updates 
    }: { 
      id: string; 
      updates: Partial<Service> 
    }) => {
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
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast({
        title: "Servicio actualizado",
        description: "El servicio ha sido actualizado exitosamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el servicio. Inténtalo de nuevo.",
        variant: "destructive",
      });
      console.error('Error updating service:', error);
    },
  });
};

export const useToggleServiceStatus = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

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
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast({
        title: data.is_active ? "Servicio activado" : "Servicio desactivado",
        description: `El servicio ha sido ${data.is_active ? 'activado' : 'desactivado'} exitosamente.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo cambiar el estado del servicio. Inténtalo de nuevo.",
        variant: "destructive",
      });
      console.error('Error toggling service status:', error);
    },
  });
};

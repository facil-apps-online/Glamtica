
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";

interface Supplier {
  id: string;
  identification_type: string;
  identification_number: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CreateSupplierData {
  identification_type: string;
  identification_number: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
}

interface UpdateSupplierData extends Partial<CreateSupplierData> {
  is_active?: boolean;
}

export const useSuppliers = () => {
  return useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as Supplier[];
    },
  });
};

export const useActiveSuppliers = () => {
  return useQuery({
    queryKey: ['suppliers', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data as Supplier[];
    },
  });
};

export const useCreateSupplier = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (supplierData: CreateSupplierData) => {
      const { data, error } = await supabase
        .from('suppliers')
        .insert(supplierData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast({
        title: "Proveedor creado",
        description: "El proveedor se ha creado correctamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo crear el proveedor.",
        variant: "destructive",
      });
      console.error('Error creating supplier:', error);
    },
  });
};

export const useUpdateSupplier = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateSupplierData }) => {
      const { data, error } = await supabase
        .from('suppliers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast({
        title: "Proveedor actualizado",
        description: "Los cambios se han guardado correctamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el proveedor.",
        variant: "destructive",
      });
      console.error('Error updating supplier:', error);
    },
  });
};

export const useToggleSupplierStatus = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from('suppliers')
        .update({ is_active })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast({
        title: `Proveedor ${data.is_active ? 'activado' : 'desactivado'}`,
        description: "El estado del proveedor se ha actualizado correctamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo cambiar el estado del proveedor.",
        variant: "destructive",
      });
      console.error('Error toggling supplier status:', error);
    },
  });
};

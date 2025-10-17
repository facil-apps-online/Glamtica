import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

// Helper hook from useSuppliers.ts
const useTenantAction = <T, P>(action: string) => {
  const { session } = useAuth();

  return async (payload: P): Promise<T> => {
    if (!session) throw new Error("No hay sesión activa.");

    const response = await fetch(`${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/tenant-actions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ action, payload }),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || `Error en la acción: ${action}`);
    }
    return result;
  };
};

// Interfaces for the new data models
export interface SupplierContact {
  id: string;
  supplier_id: string;
  contact_type_id: string;
  name: string;
  email?: string;
  phone?: string;
  created_at: string;
  contact_types: { name: string };
}

export interface SupplierAddress {
  id: string;
  supplier_id: string;
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  created_at: string;
}

// Hooks for Supplier Contacts
export const useSupplierContacts = (supplierId: string) => {
  const invokeGet = useTenantAction<SupplierContact[], { supplierId: string }>('get_supplier_contacts');
  return useQuery({
    queryKey: ['supplier_contacts', supplierId],
    queryFn: () => invokeGet({ supplierId }),
    enabled: !!supplierId,
  });
};

export const useCreateSupplierContact = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const invokeCreate = useTenantAction<SupplierContact, Omit<SupplierContact, 'id' | 'created_at'>>('create_supplier_contact');

  return useMutation({
    mutationFn: invokeCreate,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['supplier_contacts', data.supplier_id] });
      toast({ title: "Contacto creado", description: "El contacto se ha añadido exitosamente." });
    },
    onError: (error) => {
      toast({ title: "Error al crear contacto", description: error.message, variant: "destructive" });
    },
  });
};

export const useUpdateSupplierContact = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const invokeUpdate = useTenantAction<SupplierContact, Partial<SupplierContact> & { id: string }>('update_supplier_contact');

  return useMutation({
    mutationFn: invokeUpdate,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['supplier_contacts', data.supplier_id] });
      toast({ title: "Contacto actualizado", description: "Los cambios se han guardado." });
    },
    onError: (error) => {
      toast({ title: "Error al actualizar", description: error.message, variant: "destructive" });
    },
  });
};

export const useDeleteSupplierContact = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const invokeDelete = useTenantAction<{ success: boolean }, { id: string }>('delete_supplier_contact');

  return useMutation({
    mutationFn: invokeDelete,
    onSuccess: (_, variables) => {
      // We don't know the supplier_id here, so we invalidate all supplier_contacts queries
      queryClient.invalidateQueries({ queryKey: ['supplier_contacts'] });
      toast({ title: "Contacto eliminado" });
    },
    onError: (error) => {
      toast({ title: "Error al eliminar", description: error.message, variant: "destructive" });
    },
  });
};


// Hooks for Supplier Addresses
export const useSupplierAddresses = (supplierId: string) => {
    const invokeGet = useTenantAction<SupplierAddress[], { supplierId: string }>('get_supplier_addresses');
    return useQuery({
        queryKey: ['supplier_addresses', supplierId],
        queryFn: () => invokeGet({ supplierId }),
        enabled: !!supplierId,
    });
};

export const useCreateSupplierAddress = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const invokeCreate = useTenantAction<SupplierAddress, Omit<SupplierAddress, 'id' | 'created_at'>>('create_supplier_address');

    return useMutation({
        mutationFn: invokeCreate,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['supplier_addresses', data.supplier_id] });
            toast({ title: "Dirección Creada", description: "La dirección ha sido creada exitosamente.", variant: "success" });
        },
        onError: (error) => {
            toast({ title: "Error al crear dirección", description: error.message, variant: "destructive" });
        },
    });
};

export const useUpdateSupplierAddress = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const invokeUpdate = useTenantAction<SupplierAddress, Partial<SupplierAddress> & { id: string }>('update_supplier_address');

    return useMutation({
        mutationFn: invokeUpdate,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['supplier_addresses', data.supplier_id] });
            toast({ title: "Dirección Actualizada", description: "La dirección ha sido actualizada exitosamente.", variant: "success" });
        },
        onError: (error) => {
            toast({ title: "Error al actualizar", description: error.message, variant: "destructive" });
        },
    });
};

export const useDeleteSupplierAddress = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const invokeDelete = useTenantAction<{ success: boolean }, { id: string }>('delete_supplier_address');

    return useMutation({
        mutationFn: invokeDelete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['supplier_addresses'] });
            toast({ title: "Dirección eliminada" });
        },
        onError: (error) => {
            toast({ title: "Error al eliminar", description: error.message, variant: "destructive" });
        },
    });
};
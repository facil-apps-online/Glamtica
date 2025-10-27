import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

// Helper hook from useClients.ts
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
export interface ClientContact {
  id: string;
  client_id: string;
  contact_type_id: string;
  name: string;
  email?: string;
  phone?: string;
  created_at: string;
  contact_types: { name: string };
}

export interface ClientAddress {
  id: string;
  client_id: string;
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

// Hooks for Client Contacts
export const useClientContacts = (clientId: string) => {
  const invokeGet = useTenantAction<ClientContact[], { clientId: string }>('get_client_contacts');
  return useQuery({
    queryKey: ['client_contacts', clientId],
    queryFn: () => invokeGet({ clientId }),
    enabled: !!clientId,
  });
};

export const useCreateClientContact = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const invokeCreate = useTenantAction<ClientContact, Omit<ClientContact, 'id' | 'created_at'>>('create_client_contact');

  return useMutation({
    mutationFn: invokeCreate,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['client_contacts', data.client_id] });
      toast({ title: "Contacto creado", description: "El contacto se ha añadido exitosamente.", variant: "success" });
    },
    onError: (error) => {
      toast({ title: "Error al crear contacto", description: error.message, variant: "destructive" });
    },
  });
};

export const useUpdateClientContact = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const invokeUpdate = useTenantAction<ClientContact, Partial<ClientContact> & { id: string }>('update_client_contact');

  return useMutation({
    mutationFn: invokeUpdate,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['client_contacts', data.client_id] });
      toast({ title: "Contacto actualizado", description: "Los cambios se han guardado." });
    },
    onError: (error) => {
      toast({ title: "Error al actualizar", description: error.message, variant: "destructive" });
    },
  });
};

export const useDeleteClientContact = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const invokeDelete = useTenantAction<{ success: boolean }, { id: string }>('delete_client_contact');

  return useMutation({
    mutationFn: invokeDelete,
    onSuccess: (_, variables) => {
      // We don't know the client_id here, so we invalidate all client_contacts queries
      queryClient.invalidateQueries({ queryKey: ['client_contacts'] });
      toast({ title: "Contacto eliminado" });
    },
    onError: (error) => {
      toast({ title: "Error al eliminar", description: error.message, variant: "destructive" });
    },
  });
};


// Hooks for Client Addresses
export const useClientAddresses = (clientId: string) => {
    const invokeGet = useTenantAction<ClientAddress[], { clientId: string }>('get_client_addresses');
    return useQuery({
        queryKey: ['client_addresses', clientId],
        queryFn: () => invokeGet({ clientId }),
        enabled: !!clientId,
    });
};

export const useCreateClientAddress = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const invokeCreate = useTenantAction<ClientAddress, Omit<ClientAddress, 'id' | 'created_at'>>('create_client_address');

    return useMutation({
        mutationFn: invokeCreate,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['client_addresses', data.client_id] });
            toast({ title: "Dirección Creada", description: "La dirección ha sido creada exitosamente.", variant: "success" });
        },
        onError: (error) => {
            toast({ title: "Error al crear dirección", description: error.message, variant: "destructive" });
        },
    });
};

export const useUpdateClientAddress = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const invokeUpdate = useTenantAction<ClientAddress, Partial<ClientAddress> & { id: string }>('update_client_address');

    return useMutation({
        mutationFn: invokeUpdate,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['client_addresses', data.client_id] });
            toast({ title: "Dirección Actualizada", description: "La dirección ha sido actualizada exitosamente.", variant: "success" });
        },
        onError: (error) => {
            toast({ title: "Error al actualizar", description: error.message, variant: "destructive" });
        },
    });
};

export const useDeleteClientAddress = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const invokeDelete = useTenantAction<{ success: boolean }, { id: string }>('delete_client_address');

    return useMutation({
        mutationFn: invokeDelete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['client_addresses'] });
            toast({ title: "Dirección eliminada" });
        },
        onError: (error) => {
            toast({ title: "Error al eliminar", description: error.message, variant: "destructive" });
        },
    });
};
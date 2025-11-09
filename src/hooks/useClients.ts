import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { fetchTenantAction } from "@/lib/fetchTenantAction";

// Interfaces
interface Branch {
  id: string;
  name: string;
}

interface ClientBranch {
  branches: Branch | null;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  document_types: { name: string } | null;
  document_type_id?: string;
  document_number?: string;
  parent_client_id?: string;
  created_at: string;
  updated_at: string;
  client_branches: ClientBranch[];
  branches?: Branch[]; // For useClientDetails

  // Structured Address
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

// Hook to get all clients for the tenant
export const useClients = (searchTerm: string = '', showInactive: boolean = false) => {
  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;
  const branchId = currentAssignment?.branch_id;
  const roleName = currentAssignment?.role_name;

  const branchIdToFilter = roleName === 'tenant_super_admin' ? 'all' : branchId;

  return useQuery<Client[], Error>({
    queryKey: ['clients', tenantId, branchIdToFilter, searchTerm, showInactive],
    queryFn: async () => {
      if (!tenantId) return [];
      if (!branchIdToFilter) return []; // Don't fetch if branchId is not available for non-super-admins
      return fetchTenantAction('get_clients_by_branch', { branchId: branchIdToFilter, searchTerm, showInactive });
    },
    enabled: !!tenantId && !!branchIdToFilter,
  });
};

// Hook to get details for a single client
export const useClientDetails = (clientId: string) => {
  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;

  return useQuery<Client, Error>({
    queryKey: ['client', tenantId, clientId],
    queryFn: () => fetchTenantAction('get_client_details', { clientId }),
    enabled: !!tenantId && !!clientId,
  });
};

// Hook to get sub-clients for a given client
export const useSubClients = (clientId: string) => {
  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;

  return useQuery<Client[], Error>({
    queryKey: ['subClients', tenantId, clientId],
    queryFn: () => fetchTenantAction('get_sub_clients', { clientId }),
    enabled: !!tenantId && !!clientId,
  });
};

// --- MUTATIONS ---

export const useCreateClient = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;

  return useMutation<Client, Error, { clientData: Omit<Client, 'id' | 'created_at' | 'updated_at' | 'client_branches'>; branchIds: string[] }>({
    mutationFn: async ({ clientData, branchIds }) => {
      return fetchTenantAction('create_client', { clientData, branchIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['subClients', tenantId] });
      toast({
        title: "Cliente creado",
        description: "El cliente ha sido agregado exitosamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `No se pudo crear el cliente: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};

export const useUpdateClient = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;

  return useMutation<Client, Error, { clientId: string; updates: Partial<Client> }>({
    mutationFn: async ({ clientId, updates }) => {
      return fetchTenantAction('update_client', { clientId, updates });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['clients', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['client', tenantId, data.id] });
      queryClient.invalidateQueries({ queryKey: ['subClients', tenantId, data.parent_client_id] });
      toast({
        title: "Cliente actualizado",
        description: "Los datos del cliente han sido actualizados.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `No se pudo actualizar el cliente: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};

export const useDeleteClient = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;

  return useMutation<void, Error, string>({
    mutationFn: async (clientId: string) => {
      await fetchTenantAction('delete_client', { clientId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['subClients', tenantId] });
      toast({
        title: "Cliente eliminado",
        description: "El cliente ha sido eliminado del sistema.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `No se pudo eliminar el cliente: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};

// Hook to assign a client to a branch
export const useAssignClientToBranch = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;

  return useMutation<void, Error, { clientId: string; branchId: string }>({
    mutationFn: async ({ clientId, branchId }) => {
      await fetchTenantAction('assign_client_to_branch', { clientId, branchId });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clients', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['client', tenantId, variables.clientId] });
      toast({
        title: "Asignación exitosa",
        description: "El cliente ha sido asignado a la sucursal.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `No se pudo asignar el cliente: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};

// Hook to unassign a client from a branch
export const useUnassignClientFromBranch = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;

  return useMutation<void, Error, { clientId: string; branchId: string }>({
    mutationFn: async ({ clientId, branchId }) => {
      await fetchTenantAction('unassign_client_from_branch', { clientId, branchId });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clients', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['client', tenantId, variables.clientId] });
      toast({
        title: "Desasignación exitosa",
        description: "Se ha quitado el cliente de la sucursal.",
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `No se pudo desasignar el cliente: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};
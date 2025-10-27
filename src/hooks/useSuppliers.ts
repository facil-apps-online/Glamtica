import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

// La interfaz base del proveedor
export interface Supplier {
  id: string;
  tenant_id: string;
  document_type_id?: string;
  identification_number: string;
  name: string;
  phone?: string;
  email?: string;
  is_active: boolean;
  branch_ids?: string[];
  created_at: string;
  updated_at: string;

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

// Tipos para la creación y actualización, omitiendo los campos que gestiona el backend
type CreateSupplierData = Omit<Supplier, 'id' | 'tenant_id' | 'is_active' | 'created_at' | 'updated_at'> & { branch_ids?: string[] };
type UpdateSupplierData = Partial<Omit<Supplier, 'id' | 'tenant_id' | 'created_at' | 'updated_at'> & { id: string; branch_ids?: string[] }>;

// Hook genérico para invocar acciones de la Edge Function
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

// Hook para obtener TODOS los proveedores del tenant
export const useSuppliers = (searchTerm?: string, includeInactive?: boolean) => {
  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;
  const invokeGetSuppliers = useTenantAction<Supplier[], { searchTerm?: string, includeInactive?: boolean }>('get_suppliers');

  return useQuery({
    queryKey: ['suppliers', tenantId, searchTerm, includeInactive],
    queryFn: () => invokeGetSuppliers({ searchTerm, includeInactive }),
    enabled: !!tenantId,
  });
};

// Hook para obtener solo los proveedores ACTIVOS
export const useActiveSuppliers = () => {
  const { data: suppliers, ...rest } = useSuppliers();
  const activeSuppliers = suppliers?.filter(s => s.is_active);
  return { data: activeSuppliers, ...rest };
};

// Hook para obtener un proveedor por su ID
export const useSupplier = (id: string) => {
  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;
  const invokeGetSupplier = useTenantAction<Supplier, { id: string }>('get_supplier');

  return useQuery({
    queryKey: ['suppliers', tenantId, id],
    queryFn: () => invokeGetSupplier({ id }),
    enabled: !!tenantId && !!id,
  });
};

// Hook para CREAR un proveedor
export const useCreateSupplier = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { currentAssignment } = useAuth();
  const invokeCreateSupplier = useTenantAction<Supplier, CreateSupplierData>('create_supplier');

  return useMutation({
    mutationFn: invokeCreateSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers', currentAssignment?.tenant_id] });
      toast({
        title: "Proveedor creado",
        description: "El proveedor se ha registrado exitosamente.",
      });
    },
    onError: (error) => {
      toast({ title: "Error al crear", description: error.message, variant: "destructive" });
    },
  });
};

// Hook para ACTUALIZAR un proveedor
export const useUpdateSupplier = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { currentAssignment } = useAuth();
  const invokeUpdateSupplier = useTenantAction<Supplier, UpdateSupplierData>('update_supplier');

  return useMutation({
    mutationFn: invokeUpdateSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers', currentAssignment?.tenant_id] });
      toast({
        title: "Proveedor actualizado",
        description: "Los cambios se han guardado correctamente.",
      });
    },
    onError: (error) => {
      toast({ title: "Error al actualizar", description: error.message, variant: "destructive" });
    },
  });
};

// Hook para ELIMINAR un proveedor
export const useDeleteSupplier = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { currentAssignment } = useAuth();
  const invokeDeleteSupplier = useTenantAction<{ id: string }, { id: string }>('delete_supplier');

  return useMutation({
    mutationFn: invokeDeleteSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers', currentAssignment?.tenant_id] });
      toast({
        title: "Proveedor eliminado",
        description: "El proveedor ha sido eliminado exitosamente.",
      });
    },
    onError: (error) => {
      toast({ title: "Error al eliminar", description: error.message, variant: "destructive" });
    },
  });
};

// Hook para ACTIVAR/DESACTIVAR un proveedor
export const useToggleSupplierStatus = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { currentAssignment } = useAuth();
  const invokeToggle = useTenantAction<Supplier, { id: string; is_active: boolean }>('toggle_supplier_status');

  return useMutation({
    mutationFn: invokeToggle,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['suppliers', currentAssignment?.tenant_id] });
      toast({
        title: `Proveedor ${data.is_active ? 'activado' : 'desactivado'}`,
        description: "El estado del proveedor se ha actualizado.",
        variant: "success",
      });
    },
    onError: (error) => {
      toast({ title: "Error en el cambio de estado", description: error.message, variant: "destructive" });
    },
  });
};
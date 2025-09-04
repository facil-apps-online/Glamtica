import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

// --- INTERFACES ---
export interface ComboItem {
  id: string;
  combo_id: string;
  product_id: string | null;
  service_id: string | null;
  quantity: number;
  price: number; // Precio base del ítem en el combo
  product?: { name: string };
  service?: { name: string };
}

export interface Combo {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  sku?: string;
  barcode?: string;
  image_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  combo_items: ComboItem[];
}

export interface ComboAssignment {
    branch_id: string;
    is_active: boolean;
    branches: { name: string };
}

export interface ComboBranchDetails extends Omit<Combo, 'combo_items'> {
    is_active_in_branch: boolean;
    items: (ComboItem & {
      override_price: number | null;
      final_price: number;
    })[];
}

export type PriceOverride = {
    product_id?: string | null;
    service_id?: string | null;
    price: number;
};

// --- TYPES ---
type ComboCreationData = Omit<Combo, 'id' | 'tenant_id' | 'created_at' | 'updated_at' | 'combo_items'> & {
  items: Omit<ComboItem, 'id' | 'combo_id' | 'product' | 'service'>[];
};

type ComboUpdateData = Partial<Omit<ComboCreationData, 'items'> & {items: Omit<ComboItem, 'id' | 'combo_id' | 'product' | 'service'>[]}> & { id: string; is_active?: boolean };

// --- HOOKS ---

// Hook para obtener todos los combos
export const useGetCombos = () => {
  const { session, currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;

  return useQuery<Combo[], Error>({
    queryKey: ['combos', tenantId],
    queryFn: async () => {
      if (!tenantId || !session) return [];

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/tenant-actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'get_combos',
          payload: { tenantId },
        }),
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || 'Failed to fetch combos');
      }
      return json as Combo[];
    },
    enabled: !!tenantId && !!session,
  });
};

// Hook para crear un combo
export const useCreateCombo = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { session, currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;

  return useMutation<Combo, Error, ComboCreationData>({
    mutationFn: async (newComboData) => {
      if (!tenantId || !session) throw new Error("Tenant ID or session not available");

      const { items, ...comboData } = newComboData;

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/tenant-actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'create_combo',
          payload: { comboData, items },
        }),
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || 'Failed to create combo');
      }
      return json as Combo;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['combos', tenantId] });
    },
    onError: (error) => {
      toast({
        title: "Error al Crear Combo",
        description: error.message || "No se pudo crear el combo. Inténtalo de nuevo.",
        variant: "destructive",
      });
      console.error('Error creating combo:', error);
    },
  });
};

// Hook para actualizar un combo
export const useUpdateCombo = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { session, currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;

  return useMutation<Combo, Error, ComboUpdateData>({
    mutationFn: async (updateData) => {
      if (!tenantId || !session) throw new Error("Tenant ID or session not available");

      const { id, items, ...comboData } = updateData;

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/tenant-actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'update_combo',
          payload: { comboId: id, comboData, items },
        }),
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || 'Failed to update combo');
      }
      return json as Combo;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['combos', tenantId] });
    },
    onError: (error) => {
      toast({
        title: "Error al Actualizar",
        description: error.message || "No se pudo actualizar el combo. Inténtalo de nuevo.",
        variant: "destructive",
      });
      console.error('Error updating combo:', error);
    },
  });
};

// Hook para eliminar un combo
export const useDeleteCombo = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { session, currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;

  return useMutation<any, Error, string>({
    mutationFn: async (comboId) => {
      if (!tenantId || !session) throw new Error("Tenant ID or session not available");

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/tenant-actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'delete_combo',
          payload: { comboId },
        }),
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || 'Failed to delete combo');
      }
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['combos', tenantId] });
      toast({ title: "Combo Eliminado", description: "El combo ha sido eliminado exitosamente.", variant: "success" });
    },
    onError: (error) => {
      toast({ title: "Error al Eliminar", description: error.message || "No se pudo eliminar el combo.", variant: "destructive" });
      console.error('Error deleting combo:', error);
    },
  });
};

// --- Branch Management Hooks ---

export const useGetComboAssignments = (comboId: string) => {
    const { session, currentAssignment } = useAuth();
    const tenantId = currentAssignment?.tenant_id;
  
    return useQuery<ComboAssignment[], Error>({
      queryKey: ['combo_assignments', comboId],
      queryFn: async () => {
        if (!tenantId || !session || !comboId) return [];
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/tenant-actions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
          body: JSON.stringify({ action: 'get_assigned_branches_for_combo', payload: { comboId } }),
        });
        const json = await response.json();
        if (!response.ok) throw new Error(json.error || 'Failed to fetch combo assignments');
        return json;
      },
      enabled: !!tenantId && !!session && !!comboId,
    });
  };
  
  export const useAssignComboToBranch = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const { session } = useAuth();
  
    return useMutation<any, Error, { combo_id: string; branch_id: string; is_active: boolean }>({
      mutationFn: async ({ combo_id, branch_id, is_active }) => {
        if (!session) throw new Error("Session not available");
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/tenant-actions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
          body: JSON.stringify({ action: 'assign_combo_to_branch', payload: { combo_id, branch_id, is_active } }),
        });
        const json = await response.json();
        if (!response.ok) throw new Error(json.error || 'Failed to assign combo');
        return json;
      },
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['combo_assignments', variables.combo_id] });
        toast({ title: "Asignación Actualizada", variant: "success" });
      },
      onError: (error) => {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      },
    });
  };
  
  export const useUnassignComboFromBranch = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const { session } = useAuth();
  
    return useMutation<any, Error, { combo_id: string; branch_id: string }>({
      mutationFn: async ({ combo_id, branch_id }) => {
        if (!session) throw new Error("Session not available");
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/tenant-actions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
          body: JSON.stringify({ action: 'unassign_combo_from_branch', payload: { combo_id, branch_id } }),
        });
        const json = await response.json();
        if (!response.ok) throw new Error(json.error || 'Failed to unassign combo');
        return json;
      },
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['combo_assignments', variables.combo_id] });
        toast({ title: "Asignación Actualizada", variant: "success" });
      },
      onError: (error) => {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      },
    });
  };

  export const useGetComboBranchDetails = (comboId: string, branchId: string) => {
    const { session } = useAuth();
    return useQuery<ComboBranchDetails, Error>({
      queryKey: ['combo_branch_details', comboId, branchId],
      queryFn: async () => {
        if (!session || !comboId || !branchId) throw new Error("Missing parameters");
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/tenant-actions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
          body: JSON.stringify({ action: 'get_combo_branch_details', payload: { comboId, branchId } }),
        });
        const json = await response.json();
        if (!response.ok) throw new Error(json.error || 'Failed to fetch combo branch details');
        return json;
      },
      enabled: !!session && !!comboId && !!branchId,
    });
  };
  
  export const useUpdateComboBranchPrices = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const { session } = useAuth();
  
    return useMutation<any, Error, { combo_id: string; branch_id: string; price_overrides: PriceOverride[] }>({
      mutationFn: async ({ combo_id, branch_id, price_overrides }) => {
        if (!session) throw new Error("Session not available");
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/tenant-actions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
          body: JSON.stringify({ action: 'update_combo_branch_prices', payload: { combo_id, branch_id, price_overrides } }),
        });
        const json = await response.json();
        if (!response.ok) throw new Error(json.error || 'Failed to update prices');
        return json;
      },
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['combo_branch_details', variables.combo_id, variables.branch_id] });
        queryClient.invalidateQueries({ queryKey: ['branch_combos', variables.branch_id] });
        toast({ title: "Precios Actualizados", description: "Los precios para la sucursal han sido guardados.", variant: "success" });
      },
      onError: (error) => {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      },
    });
  };

  export const useGetBranchCombos = (branchId: string) => {
    const { session } = useAuth();
    return useQuery<(Combo & { is_active_in_branch: boolean })[], Error>({
      queryKey: ['branch_combos', branchId],
      queryFn: async () => {
        if (!session || !branchId) return [];
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/tenant-actions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
          body: JSON.stringify({ action: 'get_combos_for_branch', payload: { branchId } }),
        });
        const json = await response.json();
        if (!response.ok) throw new Error(json.error || 'Failed to fetch branch combos');
        return json;
      },
      enabled: !!session && !!branchId,
    });
  };

  export const useUpdateBranchComboStatus = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const { session } = useAuth();
  
    return useMutation<any, Error, { combo_id: string; branch_id: string; is_active: boolean }>({
      mutationFn: async ({ combo_id, branch_id, is_active }) => {
        if (!session) throw new Error("Session not available");
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/tenant-actions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
          body: JSON.stringify({ action: 'update_branch_combo_status', payload: { combo_id, branch_id, is_active } }),
        });
        const json = await response.json();
        if (!response.ok) throw new Error(json.error || 'Failed to update branch combo status');
        return json;
      },
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['branch_combos', variables.branch_id] });
        toast({ title: "Estado Actualizado", description: "El estado del combo en la sucursal ha sido actualizado.", variant: "success" });
      },
      onError: (error) => {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      },
    });
  };
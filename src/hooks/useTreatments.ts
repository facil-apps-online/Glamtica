import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { fetchTenantAction } from "@/lib/fetchTenantAction";
import { supabase } from "@/lib/supabaseClient"; // Added for image upload

// --- INTERFACES ---

export interface TreatmentSessionItem {
  id?: string;
  product_id: string | null;
  service_id: string | null;
  quantity: number;
  notes?: string;
}

export interface TreatmentSession {
  id?: string;
  session_number: number;
  name: string;
  description?: string;
  items: TreatmentSessionItem[];
  payment_percentage?: number | null; // Added
  fixed_payment_amount?: number | null; // Added
}

export interface TreatmentImage {
  id: string;
  image_url: string;
  is_primary: boolean;
  sort_order: number;
}

export interface TreatmentCategory {
  id: string;
  name: string;
}

export interface Treatment {
  id: string;
  name: string;
  description?: string;
  type: 'treatment' | 'project';
  upfront_price?: number;
  financed_price?: number;
  is_active: boolean;
  session_count?: number; 
  sessions?: TreatmentSession[];
  cover_image_url?: string;
  categories?: TreatmentCategory[];
  treatment_images?: TreatmentImage[];
  created_at: string;
  tenant_id: string;
}

export interface ClientTreatment {
  id: string;
  name: string;
  status: 'active' | 'completed' | 'cancelled';
  start_date: string;
  progress: {
    completed: number;
    total: number;
  };
  has_scheduled_sessions: boolean;
}

export interface ClientTreatmentSession {
    id: string;
    client_treatment_id: string;
    session_number: number;
    name: string;
    description: string;
    status: 'pending' | 'completed' | 'Cita Asignada';
    completed_at: string | null;
    attention_id: string | null;
    attention_datetime: string | null; // AÑADIR ESTA LÍNEA
    payment_due: {
        amount: number | null;
        percentage: number | null;
        status: 'pending' | 'paid';
    } | null;
}

export interface ClientTreatmentDetails extends ClientTreatment {
    sessions: ClientTreatmentSession[];
    final_price: number;
    payment_type: 'upfront' | 'financed';
}

// --- HOOKS ---

// Hook to get all treatment/project templates
export const useTreatments = (tenantId: string, type: 'treatment' | 'project', categoryId?: string, showInactive?: boolean) => {
  return useQuery<Treatment[], Error>({
    queryKey: ['treatments', tenantId, type, categoryId, showInactive],
    queryFn: async () => {
      const result = await fetchTenantAction('list_treatments', { tenant_id: tenantId, type: type, category_id: categoryId, show_inactive: showInactive });
      return result.data || [];
    },
    enabled: !!tenantId,
  });
};

// Hook to get client assigned treatments
export const useClientTreatments = (clientId: string) => {
  return useQuery<ClientTreatment[], Error>({
    queryKey: ['client_treatments', clientId],
    queryFn: async () => {
      const result = await fetchTenantAction('get_client_treatments', { client_id: clientId });
      // The RPC call returns an object with a 'data' property which is the array.
      // We need to return the data property specifically.
      return result.data || [];
    },
    enabled: !!clientId,
  });
};

// Hook to get details of a specific treatment
export const useTreatmentDetails = (treatmentId: string) => {
  return useQuery<Treatment, Error>({
    queryKey: ['treatment_details', treatmentId],
    queryFn: async () => {
      const result = await fetchTenantAction('get_treatment_details', { treatment_id: treatmentId });
      console.log('Result from get_treatment_details:', result);
      // The RPC returns an array with a single object. We need to return that object.
      return result.data?.[0] || null;
    },
    enabled: !!treatmentId,
  });
};

// Hook to get details of a specific client treatment
export const useClientTreatmentDetails = (clientTreatmentId: string) => {
  return useQuery<ClientTreatmentDetails, Error>({
    queryKey: ['client_treatment_details', clientTreatmentId],
    queryFn: async () => {
      const result = await fetchTenantAction('get_client_treatment_details', { client_treatment_id: clientTreatmentId });
      // The RPC now returns a single JSON object.
      return result.data;
    },
    enabled: !!clientTreatmentId,
  });
};

export interface Product {
  id: string;
  name: string;
  price: number;
  // Add other relevant product fields as needed from your database schema
}

export interface Service {
  id: string;
  name: string;
  price: number;
  // Add other relevant service fields as needed from your database schema
}

// Hook to get all active products for the tenant
export const useProducts = (tenantId: string) => {
  return useQuery<Product[], Error>({
    queryKey: ['products', tenantId],
    queryFn: async () => {
      const result = await fetchTenantAction('list_products', { tenant_id: tenantId });
      return result.data || [];
    },
    enabled: !!tenantId,
  });
};

// Hook to get all active services for the tenant
export const useServices = (tenantId: string) => {
  return useQuery<Service[], Error>({
    queryKey: ['services', tenantId],
    queryFn: async () => {
      const result = await fetchTenantAction('list_services', { tenant_id: tenantId });
      return result.data || [];
    },
    enabled: !!tenantId,
  });
};


// --- IMAGE HOOKS ---

// Hook to get images for a specific treatment
export const useTreatmentImages = (treatmentId: string) => {
  return useQuery<TreatmentImage[], Error>({
    queryKey: ["treatmentImages", treatmentId],
    queryFn: async () => {
      if (!treatmentId) return [];
      return fetchTenantAction("get_treatment_images", { treatmentId });
    },
    enabled: !!treatmentId,
  });
};

// Hook to delete an image from a treatment
export const useDeleteTreatmentImage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;

  return useMutation<void, Error, { imageId: string; treatmentId: string }>({
    mutationFn: ({ imageId }) => fetchTenantAction("delete_treatment_image", { imageId }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["treatmentImages", variables.treatmentId] });
      if (tenantId) {
        queryClient.invalidateQueries({ queryKey: ['treatments', tenantId, 'treatment'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['treatments'] });
      }
      toast({ title: "Éxito", description: "Imagen eliminada correctamente.", variant: "success" });
    },
    onError: (error) => {
      toast({ title: "Error", description: `No se pudo eliminar la imagen: ${error.message}`, variant: "destructive" });
    },
  });
};

// Hook to set an image as the primary one for a treatment
export const useSetPrimaryTreatmentImage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;

  return useMutation<void, Error, { treatmentId: string; imageId: string }>({
    mutationFn: (variables) => fetchTenantAction("set_primary_treatment_image", variables),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["treatmentImages", variables.treatmentId] });
      if (tenantId) {
        queryClient.invalidateQueries({ queryKey: ['treatments', tenantId, 'treatment'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['treatments'] });
      }
      toast({ title: "Éxito", description: "Imagen principal actualizada.", variant: "success" });
    },
    onError: (error) => {
      toast({ title: "Error", description: `No se pudo actualizar la imagen principal: ${error.message}`, variant: "destructive" });
    },
  });
};

// Hook to upload an image file and associate it with a treatment
export const useUploadTreatmentImage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { currentAssignment } = useAuth();

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = (error) => reject(error);
    });
  };

  return useMutation<any, Error, { treatmentId: string; file: File }>({
    mutationFn: async ({ treatmentId, file }) => {
      if (!currentAssignment?.tenant_id) {
        throw new Error("No se pudo determinar el tenant actual.");
      }

      const fileBase64 = await convertFileToBase64(file);

      const { data, error } = await supabase.functions.invoke("google-drive-upload", {
        body: {
          tenantId: currentAssignment.tenant_id,
          fileBase64,
          mimeType: file.type,
          fileName: file.name,
          uploadContext: "Treatments", // Updated context
          contextId: treatmentId,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["treatmentImages", variables.treatmentId] });
      if (currentAssignment?.tenant_id) {
        queryClient.invalidateQueries({ queryKey: ['treatments', currentAssignment.tenant_id, 'treatment'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['treatments'] });
      }
      toast({ title: "Éxito", description: "Imagen subida y asociada correctamente.", variant: "success" });
    },
    onError: (error) => {
      toast({ title: "Error", description: `Error al subir la imagen: ${error.message}`, variant: "destructive" });
    },
  });
};

export const useUpdateTreatmentImagesOrder = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;

  return useMutation<void, Error, { treatmentId: string; images_data: { id: string; sort_order: number }[] }>({
    mutationFn: (variables) => fetchTenantAction("update_treatment_images_order", variables),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["treatmentImages", variables.treatmentId] });
      if (tenantId) {
        queryClient.invalidateQueries({ queryKey: ['treatments', tenantId, 'treatment'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['treatments'] });
      }
      toast({ title: "Éxito", description: "Orden de imágenes actualizado.", variant: "success" });
    },
    onError: (error) => {
      toast({ title: "Error", description: `No se pudo reordenar las imágenes: ${error.message}`, variant: "destructive" });
    },
  });
};


// --- MUTATIONS ---

interface CustomSession {
  session_number: number;
  name: string;
  description?: string;
  items: TreatmentSessionItem[];
  payment_percentage?: number | null;
  fixed_payment_amount?: number | null;
}

// Assign a treatment to a client (and its sessions)
export const useAssignTreatmentToClient = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const { tenantId } = useAuth();

    return useMutation({
        mutationFn: (payload: {
            client_id: string;
            treatment_id: string; // This is the prototype_id
            name: string; // New: Custom name for the client treatment
            payment_type: 'upfront' | 'financed'; // Changed from selected_price_type
            final_price: number; // Changed from custom_final_price
            start_date: string;
            sessions: CustomSession[];
        }) => {
            // The edge function expects the non-prefixed keys.
            const fullPayload = {
                client_id: payload.client_id,
                treatment_id: payload.treatment_id, // This is the prototype_id
                name: payload.name, // New: Pass custom name to edge function
                payment_type: payload.payment_type,
                final_price: payload.final_price,
                start_date: payload.start_date,
                sessions: payload.sessions,
                tenant_id: tenantId, // Add tenantId directly to the payload
            };
            return fetchTenantAction('assign_treatment_to_client', fullPayload);
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['client_treatments', variables.client_id] });
            toast({ title: "Tratamiento Asignado", description: "El tratamiento y sus sesiones han sido asignados al cliente.", variant: "success" });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: `Hubo un problema al asignar el tratamiento: ${error.message}`, variant: "destructive" });
        },
    });
}

// Create a new treatment
export const useCreateTreatment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { tenantId } = useAuth();

  return useMutation({
    mutationFn: (treatmentData: Omit<Treatment, 'id' | 'created_at' | 'business_id'>) =>
      fetchTenantAction('create_treatment', { ...treatmentData, tenant_id: tenantId }), // Renamed action
    onSuccess: () => {
      if (tenantId) {
        queryClient.invalidateQueries({ queryKey: ['treatments', tenantId, 'treatment'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['treatments'] });
      }
      toast({ title: "Tratamiento Creado", description: "El nuevo tratamiento ha sido creado.", variant: "success" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
};

// Update a treatment
export const useUpdateTreatment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { tenantId } = useAuth();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Omit<Treatment, 'id' | 'created_at' | 'business_id'>> }) =>
      fetchTenantAction('update_treatment', { treatment_id: id, tenant_id: tenantId, ...updates }), // Renamed action
    onSuccess: (data, variables) => {
      if (tenantId) {
        queryClient.invalidateQueries({ queryKey: ['treatments', tenantId, 'treatment'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['treatments'] });
      }
      queryClient.invalidateQueries({ queryKey: ['treatment_details', variables.id] });
      toast({ title: "Tratamiento Actualizado", description: "El tratamiento ha sido actualizado.", variant: "success" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
};

// Delete a treatment
export const useDeleteTreatment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { tenantId } = useAuth();

  return useMutation({
    mutationFn: (id: string) =>
      fetchTenantAction('delete_treatment', { treatment_id: id, tenant_id: tenantId }), // Renamed action
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treatments'] });
      toast({ title: "Tratamiento Eliminado", description: "El tratamiento ha sido eliminado.", variant: "success" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
};

// --- New Hook for Deleting a Client's Treatment ---
export const useDeleteClientTreatment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { tenantId } = useAuth();

  return useMutation({
    mutationFn: ({ client_treatment_id, client_id }: { client_treatment_id: string; client_id: string; }) => {
        if (!tenantId) {
            throw new Error("Tenant ID not found");
        }
        return fetchTenantAction('delete_client_treatment', { 
            p_client_treatment_id: client_treatment_id,
            p_tenant_id: tenantId 
        });
    },
    onSuccess: (_, variables) => {
      // Invalidate the query for the client's treatments to refresh the list
      queryClient.invalidateQueries({ queryKey: ['client_treatments', variables.client_id] });
      toast({ title: "Éxito", description: "El tratamiento asignado ha sido eliminado.", variant: "success" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: `No se pudo eliminar el tratamiento: ${error.message}`, variant: "destructive" });
    },
  });
};

export const useCancelTreatmentSession = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (sessionId: string) => 
      fetchTenantAction('cancel_treatment_session', { p_session_id: sessionId }),
    onSuccess: () => {
      // Invalidate all client treatment details to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['client_treatment_details'] });
      toast({ title: "Sesión Cancelada", description: "La sesión ha sido marcada como cancelada.", variant: "success" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: `No se pudo cancelar la sesión: ${error.message}`, variant: "destructive" });
    },
  });
};

export const useReactivateTreatmentSession = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (sessionId: string) => 
      fetchTenantAction('reactivate_treatment_session', { p_session_id: sessionId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client_treatment_details'] });
      toast({ title: "Sesión Reactivada", description: "La sesión ahora está pendiente y puede ser asignada.", variant: "success" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: `No se pudo reactivar la sesión: ${error.message}`, variant: "destructive" });
    },
  });
};

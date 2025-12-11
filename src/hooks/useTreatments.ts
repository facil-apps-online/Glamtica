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
}

export interface TreatmentCategory {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Treatment {
  id: string;
  name: string;
  description?: string;
  type: 'treatment' | 'project';
  upfront_price?: number;
  financed_price?: number;
  is_active: boolean;
  default_payment_plan?: Array<{ session_number: number; percentage: number }>;
  session_count?: { count: number }[]; // For list view
  sessions?: TreatmentSession[]; // For detail view
  treatment_images?: TreatmentImage[];
  categories?: { treatment_categories: TreatmentCategory }[];
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
}

export interface ClientTreatmentSession {
    id: string;
    client_treatment_id: string;
    session_number: number;
    name: string;
    description: string;
    status: 'pending' | 'completed';
    completed_at: string | null;
    attention_id: string | null;
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
    queryFn: () => fetchTenantAction('list_treatments', { tenant_id: tenantId, type: type, category_id: categoryId, show_inactive: showInactive }),
    enabled: !!tenantId,
  });
};

// Hook to get client assigned treatments
export const useClientTreatments = (clientId: string) => {
  return useQuery<ClientTreatment[], Error>({
    queryKey: ['client_treatments', clientId],
    queryFn: () => fetchTenantAction('get_client_treatments', { client_id: clientId }),
    enabled: !!clientId,
  });
};

// Hook to get details of a specific treatment
export const useTreatmentDetails = (treatmentId: string) => {
  return useQuery<Treatment, Error>({
    queryKey: ['treatment_details', treatmentId],
    queryFn: () => fetchTenantAction('get_treatment_details', { treatment_id: treatmentId }),
    enabled: !!treatmentId,
  });
};

// Hook to get details of a specific client treatment
export const useClientTreatmentDetails = (clientTreatmentId: string) => {
  return useQuery<ClientTreatmentDetails, Error>({
    queryKey: ['client_treatment_details', clientTreatmentId],
    queryFn: () => fetchTenantAction('get_client_treatment_details', { client_treatment_id: clientTreatmentId }),
    enabled: !!clientTreatmentId,
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

// Assign a treatment to a client
export const useAssignTreatmentToClient = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const { tenantId } = useAuth();

    return useMutation({
        mutationFn: (payload: {
            client_id: string;
            treatment_id: string; // Renamed
            selected_price_type: 'upfront' | 'financed';
            custom_final_price?: number;
            start_date: string;
        }) => fetchTenantAction('assign_treatment_to_client', { ...payload, tenant_id: tenantId }), // Renamed action
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['client_treatments', variables.client_id] });
            toast({ title: "Tratamiento Asignado", description: "El tratamiento ha sido asignado al cliente.", variant: "success" });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
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
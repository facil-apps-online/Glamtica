import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { callTenantAction } from '@/lib/tenantActions';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';

export interface BranchPhoto {
  id: string;
  branch_id: string;
  tenant_id: string;
  google_drive_file_id: string;
  file_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  is_primary: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export const useBranchPhotos = (branchId?: string) => {
  const { tenantId } = useAuth();

  return useQuery<BranchPhoto[], Error>({
    queryKey: ['branch_photos', tenantId, branchId],
    queryFn: async () => {
      if (!branchId) return [];
      const data = await callTenantAction('get_branch_photos', { branchId });
      return data || [];
    },
    enabled: !!tenantId && !!branchId,
  });
};

export const useUploadBranchPhoto = (branchId: string) => {
  const queryClient = useQueryClient();
  const { tenantId, user } = useAuth();

  return useMutation({
    mutationFn: async (vars: { fileBase64: string; fileName: string; fileSize: number; mimeType: string; }) => {
      if (!tenantId || !user) throw new Error("User not authenticated or tenant not found.");

      const { data, error } = await supabase.functions.invoke('google-drive-upload', {
        body: {
          tenantId,
          branchId,
          userId: user.id,
          fileBase64: vars.fileBase64,
          fileName: vars.fileName,
          mimeType: vars.mimeType,
          fileSize: vars.fileSize,
          uploadContext: 'BranchPhoto',
          contextId: branchId,
        },
      });

      if (error) {
        throw new Error(error.message);
      }
      if (data.error) {
        throw new Error(data.error);
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branch_photos', tenantId, branchId] });
    },
  });
};

export const useSetPrimaryBranchPhoto = (branchId: string) => {
  const queryClient = useQueryClient();
  const { tenantId } = useAuth();

  return useMutation({
    mutationFn: (photoId: string) => 
      callTenantAction('set_primary_branch_photo', { branchId, photoId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branch_photos', tenantId, branchId] });
    },
  });
};

export const useDeleteBranchPhoto = (branchId: string) => {
  const queryClient = useQueryClient();
  const { tenantId } = useAuth();

  return useMutation({
    mutationFn: (photoId: string) => 
      callTenantAction('delete_branch_photo', { branchId, photoId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branch_photos', tenantId, branchId] });
    },
  });
};

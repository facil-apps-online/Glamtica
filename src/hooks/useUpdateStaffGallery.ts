import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { invokeTenantAction } from './useTenantUsers'; // Assuming this is the correct path
import { StaffGalleryItem } from './useStaffGallery';

interface UpdateStaffGalleryPayload {
  staff_id: string;
  gallery_items: Array<{ evidence_id: string; display_order: number; is_favorite: boolean }>;
}

export const useUpdateStaffGallery = () => {
  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;
  const queryClient = useQueryClient();

  return useMutation<any, Error, { staffId: string, items: StaffGalleryItem[] }>({
    mutationFn: async ({ staffId, items }) => {
      if (!tenantId) throw new Error('Tenant ID is not available.');
      const payload: UpdateStaffGalleryPayload = {
        staff_id: staffId,
        gallery_items: items.map(item => ({
          evidence_id: item.id, // Assuming item.id is the evidence_id
          display_order: item.display_order,
          is_favorite: item.is_favorite,
        })),
      };
      return await invokeTenantAction('update_staff_gallery', payload);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['staffGallery', variables.staffId, tenantId] });
      // Optionally, show a success toast or notification
    },
    onError: (error) => {
      console.error('Error updating staff gallery:', error);
      // Optionally, show an error toast or notification
    },
  });
};

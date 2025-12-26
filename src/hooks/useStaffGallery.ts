import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { invokeTenantAction } from './useTenantUsers'; // Assuming this is the correct path

export interface StaffGalleryItem {
  id: string; // evidence_id
  google_drive_file_id: string;
  file_name: string;
  mime_type: string;
  created_at: string;
  display_order: number;
  is_favorite: boolean;
  // Potentially add image_url if the backend provides it or it's constructed in frontend
}

export const useStaffGallery = (staffId: string) => {
  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;

  return useQuery<StaffGalleryItem[], Error>({
    queryKey: ['staffGallery', staffId, tenantId],
    queryFn: async () => {
      if (!tenantId || !staffId) return [];
      const data = await invokeTenantAction('get_staff_gallery', { staff_id: staffId });
      return data as StaffGalleryItem[];
    },
    enabled: !!staffId && !!tenantId,
  });
};

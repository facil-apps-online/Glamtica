import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { callTenantAction } from '@/lib/tenantActions';

export const useAvailableUsers = (
  serviceId?: string,
  itemType?: 'service' | 'combo',
  appointmentDate?: string,
  appointmentTime?: string,
  duration?: number,
  branchId?: string,
  assignedUserId?: string,
  attentionId?: string, // New parameter
  searchTerm?: string,
  clientId?: string,
) => {
  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;

  return useQuery({
    queryKey: ['available-users', serviceId, itemType, appointmentDate, appointmentTime, duration, branchId, assignedUserId, attentionId, searchTerm, clientId],
    queryFn: () => callTenantAction('get_available_users', { 
      serviceId, 
      itemType,
      appointmentDate, 
      appointmentTime, 
      duration, 
      branchId, 
      tenantId,
      assignedUserId,
      attentionId, // Pasar el ID de la atención al backend
      searchTerm,
      clientId,
    }),
    enabled: !!serviceId && !!itemType && (duration > 0 || itemType === 'combo'),
    staleTime: 0, // Force refetch on every change
  });
};

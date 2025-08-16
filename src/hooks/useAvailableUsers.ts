import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { callTenantAction } from '@/lib/tenantActions';

export const useAvailableUsers = (
  serviceId?: string,
  appointmentDate?: string,
  appointmentTime?: string,
  duration?: number,
  branchId?: string
) => {
  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;

  return useQuery({
    queryKey: ['available-users', serviceId, appointmentDate, appointmentTime, duration, branchId],
    queryFn: () => callTenantAction('get_available_users', { 
      serviceId, 
      appointmentDate, 
      appointmentTime, 
      duration, 
      branchId, 
      tenantId 
    }),
    enabled: !!serviceId && !!appointmentDate && !!appointmentTime && !!duration && !!branchId,
  });
};

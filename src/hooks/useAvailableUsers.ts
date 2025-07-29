import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

export const useAvailableUsers = (
  serviceId?: string,
  appointmentDate?: string,
  appointmentTime?: string,
  duration?: number
) => {
  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;
  const branchId = currentAssignment?.branch_id;

  return useQuery({
    queryKey: ['available-users', serviceId, appointmentDate, appointmentTime, duration, branchId],
    queryFn: async () => {
      if (!serviceId || !appointmentDate || !appointmentTime || !duration || !branchId || !tenantId) {
        return [];
      }

      // 1. Find users who have a commission for this service in this branch
      const { data: usersWithCommission, error: commissionError } = await supabase
        .from('service_user_commissions')
        .select('user_id, commission_rate, users!inner(id, first_name, last_name, is_active, is_schedulable)')
        .eq('service_id', serviceId)
        .eq('branch_id', branchId)
        .eq('users.is_active', true)
        .eq('users.is_schedulable', true);

      if (commissionError) {
        console.error('Error fetching users with commission:', commissionError);
        throw new Error(commissionError.message);
      }

      if (!usersWithCommission || usersWithCommission.length === 0) {
        return [];
      }

      // 2. For each user, check their availability using the DB function
      const availabilityChecks = usersWithCommission.map(commission =>
        supabase.rpc('check_user_availability', {
          p_user_id: commission.users!.id,
          p_appointment_date: appointmentDate,
          p_appointment_time: appointmentTime,
          p_duration_minutes: duration,
        })
      );

      const availabilityResults = await Promise.all(availabilityChecks);

      // 3. Filter the users based on the availability check result
      const availableUsers = usersWithCommission.filter((_, index) => {
        const result = availabilityResults[index];
        if (result.error) {
          console.error(`Error checking availability for user ${usersWithCommission[index].users!.id}:`, result.error);
          return false;
        }
        return result.data === true;
      });
      
      // Format the final result
      return availableUsers.map(u => ({
        user_id: u.users!.id,
        commission_rate: u.commission_rate,
        users: {
            id: u.users!.id,
            name: `${u.users!.first_name || ''} ${u.users!.last_name || ''}`.trim(),
            is_active: u.users!.is_active
        }
      }));
    },
    enabled: !!serviceId && !!appointmentDate && !!appointmentTime && !!duration && !!branchId,
  });
};

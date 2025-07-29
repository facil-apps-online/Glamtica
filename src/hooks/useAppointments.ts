import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { useBranchFilterStore } from "@/stores/branchFilterStore";

// (Interface Appointment a ser actualizada si es necesario en otro paso)

export const useAppointments = (userId?: string, statusFilter?: string, dateFilter?: Date) => {
  const { currentAssignment } = useAuth();
  const { selectedBranchId } = useBranchFilterStore();
  const tenantId = currentAssignment?.tenant_id;

  return useQuery({
    queryKey: ['appointments', tenantId, selectedBranchId, userId, statusFilter, dateFilter],
    queryFn: async () => {
      if (!tenantId) return [];

      let query = supabase
        .from('appointments')
        .select(`*, clients(name, phone, email), users(first_name, last_name, specialties), services(name, duration_minutes, price)`)
        .eq('tenant_id', tenantId);

      if (selectedBranchId !== 'all') {
        query = query.eq('branch_id', selectedBranchId);
      }
      
      if (userId && userId !== 'all') {
        query = query.eq('user_id', userId);
      }
      
      // (Resto de filtros y lógica igual)
      
      const { data: appointments, error } = await query;
      if (error) throw new Error(error.message);
      
      // (Lógica de cálculo de totales igual)
      const appointmentsWithTotals = appointments?.map(apt => ({
        ...apt,
        grand_total: apt.total_price + (apt.total_extra_services || 0)
      }));

      return appointmentsWithTotals;
    },
    enabled: !!tenantId,
  });
};

export const useAppointmentDates = (userId?: string) => {
  const { currentAssignment } = useAuth();
  const { selectedBranchId } = useBranchFilterStore();
  const tenantId = currentAssignment?.tenant_id;

  return useQuery({
    queryKey: ['appointment-dates', tenantId, selectedBranchId, userId],
    queryFn: async () => {
      if (!tenantId) return [];

      let query = supabase
        .from('appointments')
        .select('appointment_date, status')
        .in('status', ['Confirmada', 'En Proceso', 'Completada'])
        .eq('tenant_id', tenantId);

      if (selectedBranchId !== 'all') {
        query = query.eq('branch_id', selectedBranchId);
      }

      if (userId && userId !== 'all') {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);

      // (Lógica de agrupación de fechas igual)
      const datesByStatus = data.reduce((acc, { appointment_date, status }) => {
        if (!acc[appointment_date]) {
          acc[appointment_date] = new Set();
        }
        acc[appointment_date].add(status);
        return acc;
      }, {} as Record<string, Set<string>>);

      return datesByStatus;
    },
    enabled: !!tenantId,
  });
};

// --- MUTATIONS ---
// (Las mutaciones no necesitan cambios en su lógica interna, pero sí en la invalidación)

export const useCreateAppointment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;

  return useMutation({
    // (mutationFn igual)
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['appointment-dates'] });
      toast({ title: "Cita creada", description: "La cita ha sido creada exitosamente." });
    },
    // (onError igual)
  });
};


// ... (resto de mutaciones con invalidación similar)

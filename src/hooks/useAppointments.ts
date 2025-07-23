import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { useBranchFilterStore } from "@/stores/branchFilterStore";

// ... (interfaz Appointment sin cambios)

export const useAppointments = (stylistId?: string, statusFilter?: string, dateFilter?: Date) => {
  const { currentAssignment } = useAuth();
  const { selectedBranchId } = useBranchFilterStore();
  const tenantId = currentAssignment?.tenant_id;

  return useQuery({
    queryKey: ['appointments', tenantId, selectedBranchId, stylistId, statusFilter, dateFilter],
    queryFn: async () => {
      if (!tenantId) return [];

      let query = supabase
        .from('appointments')
        .select(`*, clients(name, phone, email), stylists(name, specialties), services(name, duration_minutes, price)`)
        .eq('tenant_id', tenantId);

      // Aplicar filtro de sucursal
      if (selectedBranchId !== 'all') {
        query = query.eq('branch_id', selectedBranchId);
      }
      
      // ... (resto de la lógica de filtros sin cambios)

      const { data: appointments, error } = await query;
      // ... (resto de la función sin cambios)
      return appointmentsWithTotals as Appointment[];
    },
    enabled: !!tenantId,
  });
};

export const useAppointmentDates = (stylistId?: string) => {
  const { currentAssignment } = useAuth();
  const { selectedBranchId } = useBranchFilterStore();
  const tenantId = currentAssignment?.tenant_id;

  return useQuery({
    queryKey: ['appointment-dates', tenantId, selectedBranchId, stylistId],
    queryFn: async () => {
      if (!tenantId) return [];

      let query = supabase
        .from('appointments')
        .select('appointment_date, status')
        .in('status', ['Confirmada', 'En Proceso', 'Completada'])
        .eq('tenant_id', tenantId);

      // Aplicar filtro de sucursal
      if (selectedBranchId !== 'all') {
        query = query.eq('branch_id', selectedBranchId);
      }

      if (stylistId && stylistId !== 'all') {
        query = query.eq('stylist_id', stylistId);
      }

      const { data, error } = await query;
      // ... (resto de la función sin cambios)
      return datesByStatus;
    },
    enabled: !!tenantId,
  });
};

// --- MUTACIONES ---
// (Las mutaciones no necesitan cambios, pero es bueno revisar la invalidación)

export const useCreateAppointment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;

  return useMutation({
    // ... (código de la mutación sin cambios)
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['appointment-dates', tenantId] });
      toast({ title: "Cita creada", description: "La cita ha sido creada exitosamente." });
    },
    // ... (onError sin cambios)
  });
};

// ... (resto de mutaciones con invalidación similar)

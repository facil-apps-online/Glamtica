import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export interface Appointment {
  id: string;
  client_id: string;
  stylist_id: string;
  service_id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  notes?: string;
  total_price: number;
  created_at: string;
  updated_at: string;
  clients: {
    name: string;
    phone: string;
    email?: string;
  };
  stylists: {
    name: string;
    specialties: string[];
  };
  services: {
    name: string;
    duration_minutes: number;
    price: number;
  };
  // Agregar campos calculados para los totales
  products_total?: number;
  extra_services_total?: number;
  grand_total?: number;
  // Información de pago
  paid_amount?: number;
  discount_amount?: number;
  discount_reason?: string;
}

// Nuevo hook para verificar disponibilidad de estilistas
export const useStylistAvailability = () => {
  return useMutation({
    mutationFn: async ({ 
      stylistId, 
      appointmentDate, 
      appointmentTime, 
      durationMinutes = 60 
    }: {
      stylistId: string;
      appointmentDate: string;
      appointmentTime: string;
      durationMinutes?: number;
    }) => {
      const { data, error } = await supabase.rpc('check_stylist_availability', {
        p_stylist_id: stylistId,
        p_appointment_date: appointmentDate,
        p_appointment_time: appointmentTime,
        p_duration_minutes: durationMinutes
      });

      if (error) {
        console.error('Error checking availability:', error);
        throw error;
      }

      return data;
    },
  });
};

export const useAppointments = (stylistId?: string, statusFilter?: string, dateFilter?: Date) => {
  return useQuery({
    queryKey: ['appointments', stylistId, statusFilter, dateFilter],
    queryFn: async () => {
      try {
        let query = supabase
          .from('appointments')
          .select(`
            *,
            clients(name, phone, email),
            stylists(name, specialties),
            services(name, duration_minutes, price)
          `)
          .order('appointment_date', { ascending: true })
          .order('appointment_time', { ascending: true });

        // Filtrar por estilista si se especifica
        if (stylistId && stylistId !== 'all') {
          query = query.eq('stylist_id', stylistId);
        }

        // Filtrar por fecha si se especifica
        if (dateFilter) {
          const dateString = format(dateFilter, 'yyyy-MM-dd');
          query = query.eq('appointment_date', dateString);
        }

        // Filtrar por estado
        if (statusFilter === 'pending') {
          // Solo mostrar citas confirmadas y en proceso (pendientes de finalizar)
          query = query.in('status', ['Confirmada', 'En Proceso']);
        } else if (statusFilter && statusFilter !== 'all') {
          // Filtrar por estado específico
          query = query.eq('status', statusFilter);
        }
        // Si statusFilter es 'all' o no se especifica, mostrar todas las citas

        const { data: appointments, error } = await query;

        if (error) {
          console.error('Error fetching appointments:', error);
          throw error;
        }

        if (!appointments) return [];

        // Para cada cita, obtener los totales de productos, servicios extras y pagos
        const appointmentsWithTotals = await Promise.all(
          appointments.map(async (appointment) => {
            let products_total = 0;
            let extra_services_total = 0;

            try {
              // Obtener productos con manejo de errores mejorado
              try {
                const { data: products, error: productsError } = await supabase
                  .from('appointment_products')
                  .select('total_price')
                  .eq('appointment_id', appointment.id);

                if (productsError) {
                  console.warn('Error fetching products for appointment:', appointment.id, productsError);
                } else if (products) {
                  products_total = products.reduce((sum, p) => sum + Number(p.total_price || 0), 0);
                }
              } catch (error) {
                console.warn('Failed to fetch products for appointment:', appointment.id, error);
              }

              // Obtener servicios extras con manejo de errores mejorado
              try {
                const { data: extraServices, error: servicesError } = await supabase
                  .from('appointment_extra_services')
                  .select('price')
                  .eq('appointment_id', appointment.id);

                if (servicesError) {
                  console.warn('Error fetching extra services for appointment:', appointment.id, servicesError);
                } else if (extraServices) {
                  extra_services_total = extraServices.reduce((sum, s) => sum + Number(s.price || 0), 0);
                }
              } catch (error) {
                console.warn('Failed to fetch extra services for appointment:', appointment.id, error);
              }

              // Obtener información de pago si está pagada
              let paymentInfo = {};
              if (appointment.status === 'Pagada') {
                const grand_total = Number(appointment.total_price) + products_total + extra_services_total;
                
                // Por ahora, asumimos que se pagó el total completo sin descuento
                // En una implementación real, esto vendría de la tabla de pagos
                paymentInfo = {
                  paid_amount: grand_total,
                  discount_amount: 0,
                  discount_reason: ''
                };
              }

              const grand_total = Number(appointment.total_price) + products_total + extra_services_total;

              return {
                ...appointment,
                products_total,
                extra_services_total,
                grand_total,
                ...paymentInfo,
              };
            } catch (error) {
              console.error('Error processing appointment:', appointment.id, error);
              // Retornar la cita sin totales en caso de error
              return {
                ...appointment,
                products_total: 0,
                extra_services_total: 0,
                grand_total: Number(appointment.total_price),
              };
            }
          })
        );

        return appointmentsWithTotals as Appointment[];
      } catch (error) {
        console.error('Error in useAppointments:', error);
        throw error;
      }
    },
    retry: 1,
    retryDelay: 1000,
  });
};

// Nuevo hook para obtener días con citas pendientes
export const useAppointmentDates = (stylistId?: string) => {
  return useQuery({
    queryKey: ['appointment-dates', stylistId],
    queryFn: async () => {
      try {
        let query = supabase
          .from('appointments')
          .select('appointment_date, status')
          .in('status', ['Confirmada', 'En Proceso', 'Completada']);

        if (stylistId && stylistId !== 'all') {
          query = query.eq('stylist_id', stylistId);
        }

        const { data, error } = await query;

        if (error) {
          console.error('Error fetching appointment dates:', error);
          throw error;
        }

        // Agrupar fechas por estado
        const datesByStatus = data?.reduce((acc, appointment) => {
          const date = appointment.appointment_date;
          if (!acc[date]) {
            acc[date] = [];
          }
          acc[date].push(appointment.status);
          return acc;
        }, {} as Record<string, string[]>) || {};

        return datesByStatus;
      } catch (error) {
        console.error('Error in useAppointmentDates:', error);
        throw error;
      }
    },
    retry: 1,
    retryDelay: 1000,
  });
};

export const useCreateAppointment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (appointmentData: {
      client_id: string;
      stylist_id: string;
      service_id: string;
      appointment_date: string;
      appointment_time: string;
      notes?: string;
      total_price: number;
    }) => {
      const { data, error } = await supabase
        .from('appointments')
        .insert([appointmentData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast({
        title: "Cita creada",
        description: "La cita ha sido creada exitosamente.",
      });
    },
    onError: (error) => {
      console.error('Error creating appointment:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la cita. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateAppointment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      id, 
      updates 
    }: { 
      id: string; 
      updates: Partial<Appointment> 
    }) => {
      const { data, error } = await supabase
        .from('appointments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast({
        title: "Cita actualizada",
        description: "La cita ha sido actualizada exitosamente.",
      });
    },
    onError: (error) => {
      console.error('Error updating appointment:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la cita. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });
};

export const useCancelAppointment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('appointments')
        .update({ status: 'Cancelada' })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast({
        title: "Cita cancelada",
        description: "La cita ha sido cancelada exitosamente.",
      });
    },
    onError: (error) => {
      console.error('Error cancelling appointment:', error);
      toast({
        title: "Error",
        description: "No se pudo cancelar la cita. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });
};
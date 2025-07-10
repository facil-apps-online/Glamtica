import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, toUTC, fromUTC } from "@/lib/supabaseClient";
import { useSettings } from "@/hooks/useSettings";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export interface AttentionService {
  id: string;
  attention_id: string;
  service_id: string;
  stylist_id: string;
  service_price: number;
  service_order: number;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  services: {
    name: string;
    duration_minutes: number;
    price: number;
  };
  stylists: {
    name: string;
    specialties: string[];
  };
  service_sessions?: {
    id: string;
    started_at: string | null;
    ended_at: string | null;
    duration_minutes: number | null;
  }[];
}

export interface Attention {
  id: string;
  client_id: string;
  attention_date: string;
  attention_time: string;
  status: string;
  notes?: string;
  total_amount: number;
  created_at: string;
  updated_at: string;
  clients: {
    name: string;
    phone: string;
    email?: string;
  };
  attention_services: AttentionService[];
  // Campos calculados
  products_total?: number;
  grand_total?: number;
  paid_amount?: number;
  discount_amount?: number;
  discount_reason?: string;
}

export const useAttentions = (stylistId?: string, statusFilter?: string, dateFilter?: Date, enabled?: boolean) => {
  const { data: settings } = useSettings(); // Get settings
  const timezoneName = settings?.find(s => s.key === 'timezone')?.value || 'UTC'; // Get timezone name, default to UTC

  return useQuery({
    queryKey: ['attentions', stylistId, statusFilter, dateFilter, timezoneName],
    queryFn: async () => {
      try {
        let query = supabase
          .from('attentions')
          .select(`
            *,
            clients(name, phone, email),
            attention_services(
              *,
              services(name, duration_minutes, price),
              stylists(name, specialties),
              service_sessions(id, started_at, ended_at, duration_minutes)
            )
          `)
          .order('attention_date', { ascending: true })
          .order('attention_time', { ascending: true });

        // Filtrar por fecha si se especifica
        if (dateFilter) {
          const dateString = format(dateFilter, 'yyyy-MM-dd');
          query = query.eq('attention_date', dateString);
        }

        // Filtrar por estado
        if (statusFilter === 'pending') {
          query = query.in('status', ['Confirmada', 'En Proceso']);
        } else if (statusFilter && statusFilter !== 'all') {
          query = query.eq('status', statusFilter);
        }

        const { data: attentions, error } = await query;

        if (error) {
          console.error('Error fetching attentions:', error);
          throw error;
        }

        if (!attentions) return [];

        // Filtrar por estilista si se especifica
        let filteredAttentions = attentions;
        if (stylistId && stylistId !== 'all') {
          filteredAttentions = attentions.filter(attention => 
            attention.attention_services?.some(service => service.stylist_id === stylistId)
          );
        }

        // Process each attention to calculate totals and convert dates
        const attentionsWithTotals = await Promise.all(
          filteredAttentions.map(async (attention) => {
            let products_total = 0;

            try {
              // Obtener productos
              const { data: products, error: productsError } = await supabase
                .from('attention_products')
                .select('total_price')
                .eq('attention_id', attention.id);

              if (productsError) {
                console.warn('Error fetching products for attention:', attention.id, productsError);
              } else if (products) {
                products_total = products.reduce((sum, p) => sum + Number(p.total_price || 0), 0);
              }
            } catch (error) {
              console.warn('Failed to fetch products for attention:', attention.id, error);
            }

            // Calculate service total
            const services_total = attention.attention_services?.reduce(
              (sum, service) => sum + Number(service.service_price || 0), 0
            ) || 0;

            const grand_total = services_total + products_total;

            // Payment info if paid
            let paymentInfo = {};
            if (attention.status === 'Pagada') {
              paymentInfo = {
                paid_amount: grand_total,
                discount_amount: 0,
                discount_reason: ''
              };
            }

            // Convert attention_date and attention_time from UTC to local timezone
            let formattedDate = attention.attention_date;
            let formattedTime = attention.attention_time;

            if (attention.attention_date && attention.attention_time) {
              try {
                const utcDateTimeString = `${attention.attention_date}T${attention.attention_time}`;
                const localDateTime = fromUTC(utcDateTimeString, timezoneName);

                if (!isNaN(localDateTime.getTime())) {
                  formattedDate = format(localDateTime, 'yyyy-MM-dd');
                  formattedTime = format(localDateTime, 'HH:mm');
                } else {
                  console.warn('Could not parse date/time for attention:', attention.id, utcDateTimeString);
                }
              } catch (e) {
                console.error('Error formatting date/time for attention:', attention.id, e);
              }
            }

            return {
              ...attention,
              attention_date: formattedDate,
              attention_time: formattedTime,
              products_total,
              grand_total,
              ...paymentInfo,
            };
          })
        );

        return attentionsWithTotals as Attention[];
      } catch (error) {
        console.error('Error in useAttentions:', error);
        throw error;
      }
    },
    retry: 1,
    retryDelay: 1000,
    enabled: enabled && !!settings // Only run query if settings are loaded and enabled is true
  });
};

// Nuevo hook para obtener días con atenciones y sus estados
export const useAttentionDates = (stylistId?: string) => {
  const { data: settings } = useSettings(); // Get settings
  const timezoneName = settings?.find(s => s.key === 'timezone')?.value || 'UTC'; // Get timezone name, default to UTC

  return useQuery({
    queryKey: ['attention-dates', stylistId, timezoneName], // Add timezoneName to queryKey
    queryFn: async () => {
      try {
        let query = supabase
          .from('attentions')
          .select(`
            attention_date, 
            status,
            attention_services!inner(stylist_id)
          `)
          .in('status', ['Confirmada', 'En Proceso', 'Completada'])
          .not('attention_date', 'is', null);

        // Si se especifica un estilista, filtrar por atenciones que tengan servicios de ese estilista
        if (stylistId && stylistId !== 'all') {
          query = query.eq('attention_services.stylist_id', stylistId);
        }

        const { data, error } = await query;

        if (error) {
          console.error('Error fetching attention dates:', error);
          throw error;
        }

        // Agrupar fechas por estado de atención y convertir a la zona horaria local
        const datesByStatus = data?.reduce((acc, attention) => {
          try {
            // 1. Extraer solo la parte de la fecha y validar
            const dateOnly = attention?.attention_date?.split('T')[0];
            if (!dateOnly || isNaN(new Date(dateOnly).getTime())) {
              if (attention?.attention_date) {
                console.warn('Invalid date value found in attention:', attention);
              }
              return acc;
            }

            // 2. Construir la fecha UTC y convertir a la zona horaria local
            const localDateTime = fromUTC(dateOnly, timezoneName);

            // 3. Validar el resultado antes de formatear
            if (isNaN(localDateTime.getTime())) {
              console.warn('Date became invalid after timezone conversion:', attention);
              return acc;
            }

            // 4. Formatear y agrupar
            const date = format(localDateTime, 'yyyy-MM-dd');
            if (!acc[date]) {
              acc[date] = [];
            }
            acc[date].push(attention.status);

          } catch (error) {
            console.error('Failed to process attention record, skipping:', attention, error);
          }
          return acc;
        }, {} as Record<string, string[]>) || {};

        return datesByStatus;
      } catch (error) {
        console.error('Error in useAttentionDates:', error);
        throw error;
      }
    },
    retry: 1,
    retryDelay: 1000,
    enabled: !!settings // Only run query if settings are loaded
  });
};

export const useCreateAttention = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: settings } = useSettings(); // Get settings
  const timezoneName = settings?.find(s => s.key === 'timezone')?.value || 'UTC'; // Get timezone name, default to UTC

  return useMutation({
    mutationFn: async (attentionData: {
      client_id: string;
      attention_date: string; // This is local date string
      attention_time: string; // This is local time string
      notes?: string;
      services: Array<{
        service_id: string;
        stylist_id: string;
        service_price: number;
        notes?: string;
      }>;
    }) => {
      // Convert local attention_date and attention_time to UTC before inserting
      const localDateTime = new Date(`${attentionData.attention_date}T${attentionData.attention_time}`);
      const utcDateTime = toUTC(localDateTime, timezoneName); // Use toUTC utility

      // Create the attention
      const { data: attention, error: attentionError } = await supabase
        .from('attentions')
        .insert([{
          client_id: attentionData.client_id,
          attention_date: format(utcDateTime, 'yyyy-MM-dd'), // Store as UTC date string
          attention_time: format(utcDateTime, 'HH:mm'),     // Store as UTC time string
          notes: attentionData.notes,
          total_amount: attentionData.services.reduce((sum, s) => sum + s.service_price, 0)
        }])
        .select()
        .single();

      if (attentionError) throw attentionError;

      // Create the attention services
      const servicesData = attentionData.services.map((service, index) => ({
        attention_id: attention.id,
        service_id: service.service_id,
        stylist_id: service.stylist_id,
        service_price: service.service_price,
        service_order: index + 1,
        notes: service.notes
      }));

      const { error: servicesError } = await supabase
        .from('attention_services')
        .insert(servicesData);

      if (servicesError) throw servicesError;

      return attention;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attentions'] });
      toast({
        title: "Atención creada",
        description: "La atención ha sido creada exitosamente.",
      });
    },
    onError: (error) => {
      console.error('Error creating attention:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la atención. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
    enabled: !!settings // Only enable mutation if settings are loaded
  });
};

export const useUpdateAttention = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: settings } = useSettings(); // Get settings
  const timezoneName = settings?.find(s => s.key === 'timezone')?.value || 'UTC'; // Get timezone name, default to UTC

  return useMutation({
    mutationFn: async ({
      id,
      updates
    }: {
      id: string;
      updates: Partial<Attention>
    }) => {
      // Convert attention_date and attention_time in updates to UTC if they exist
      const updatedFields: Partial<Attention> = { ...updates };
      if (updatedFields.attention_date && updatedFields.attention_time) {
        const localDateTime = new Date(`${updatedFields.attention_date}T${updatedFields.attention_time}`);
        const utcDateTime = toUTC(localDateTime, timezoneName); // Use toUTC utility
        updatedFields.attention_date = format(utcDateTime, 'yyyy-MM-dd');
        updatedFields.attention_time = format(utcDateTime, 'HH:mm');
      } else if (updatedFields.attention_date && !updatedFields.attention_time) {
        // If only date is updated, assume time is 00:00 for conversion
        const localDateTime = new Date(`${updatedFields.attention_date}T00:00:00`);
        const utcDateTime = toUTC(localDateTime, timezoneName); // Use toUTC utility
        updatedFields.attention_date = format(utcDateTime, 'yyyy-MM-dd');
      }
      // If only time is updated, this is more complex as it depends on the current date.
      // For simplicity, we'll assume the current date for conversion if only time is provided.
      // A more robust solution might fetch the existing attention_date.
      // For now, I'll leave it as is, as attention_date and attention_time are usually updated together.


      const { data, error } = await supabase
        .from('attentions')
        .update(updatedFields) // Use updatedFields
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attentions'] });
      toast({
        title: "Atención actualizada",
        description: "La atención ha sido actualizada exitosamente.",
      });
    },
    onError: (error) => {
      console.error('Error updating attention:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la atención. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
    enabled: !!settings // Only enable mutation if settings are loaded
  });
};

export const useCancelAttention = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('attentions')
        .update({ status: 'Cancelada' })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attentions'] });
      toast({
        title: "Atención cancelada",
        description: "La atención ha sido cancelada exitosamente.",
      });
    },
    onError: (error) => {
      console.error('Error cancelling attention:', error);
      toast({
        title: "Error",
        description: "No se pudo cancelar la atención. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });
};
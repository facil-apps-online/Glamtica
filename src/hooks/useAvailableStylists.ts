import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { format } from "date-fns";

export const useAvailableStylists = (
  serviceId: string, 
  appointmentDate?: Date, 
  appointmentTime?: string,
  isAttention = false
) => {
  return useQuery({
    queryKey: ['available-stylists', serviceId, appointmentDate, appointmentTime, isAttention],
    queryFn: async () => {
      // Simplificado temporalmente: solo obtener estilistas que pueden realizar el servicio
      // Sin restricciones de horario por ahora
      const { data: serviceCommissions, error } = await supabase
        .from('service_stylist_commissions')
        .select(`
          stylist_id,
          commission_rate,
          can_perform,
          stylists(id, name, is_active)
        `)
        .eq('service_id', serviceId)
        .eq('can_perform', true);

      if (error) {
        console.error('Error fetching service commissions:', error);
        throw error;
      }

      // Filtrar solo estilistas activos
      const availableStylists = serviceCommissions?.filter(sc => sc.stylists?.is_active) || [];
      
      console.log('Available stylists for service:', serviceId, availableStylists.map(s => s.stylists?.name));
      
      return availableStylists;
    },
    enabled: !!serviceId,
  });
};

// Función para determinar si dos servicios pueden realizarse simultáneamente
function canServicesBeSimultaneous(service1: string, service2: string): boolean {
  // Convertir a minúsculas para comparación
  const s1 = service1.toLowerCase();
  const s2 = service2.toLowerCase();
  
  // Servicios que pueden realizarse simultáneamente
  const simultaneousServices = {
    // Tintes y coloraciones pueden hacerse mientras se atiende otro cliente
    'tinte': ['corte', 'peinado', 'lavado', 'secado', 'tratamiento capilar'],
    'coloración': ['corte', 'peinado', 'lavado', 'secado', 'tratamiento capilar'],
    'mechas': ['corte', 'peinado', 'lavado', 'secado'],
    'decoloración': ['corte', 'peinado', 'lavado', 'secado'],
    
    // Tratamientos que requieren tiempo de espera
    'tratamiento capilar': ['corte', 'peinado', 'lavado', 'secado', 'tinte', 'coloración'],
    'mascarilla': ['corte', 'peinado', 'lavado', 'secado', 'tinte', 'coloración'],
    'keratina': ['corte', 'peinado', 'lavado', 'secado'],
    
    // Servicios de manicura/pedicura pueden hacerse mientras se procesa el cabello
    'manicura': ['tinte', 'coloración', 'tratamiento capilar', 'mascarilla'],
    'pedicura': ['tinte', 'coloración', 'tratamiento capilar', 'mascarilla'],
    
    // Servicios básicos que pueden combinarse
    'lavado': ['tinte', 'coloración', 'tratamiento capilar', 'mascarilla'],
    'secado': ['manicura', 'pedicura']
  };
  
  // Verificar si service1 puede ser simultáneo con service2
  for (const [baseService, compatibleServices] of Object.entries(simultaneousServices)) {
    if (s1.includes(baseService)) {
      for (const compatible of compatibleServices) {
        if (s2.includes(compatible)) {
          return true;
        }
      }
    }
    
    // Verificar en la dirección opuesta
    if (s2.includes(baseService)) {
      for (const compatible of compatibleServices) {
        if (s1.includes(compatible)) {
          return true;
        }
      }
    }
  }
  
  // Si no se encuentra una combinación específica, asumir que no pueden ser simultáneos
  return false;
}
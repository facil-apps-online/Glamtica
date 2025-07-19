import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

// Tipos de datos que esperamos de la función RPC
export interface PublicCountry {
  id: string;
  name: string;
  iso_code: string;
  default_localization_id: string | null;
  default_currency_id: string | null;
  timezone: string | null;
}

export interface PublicLanguage {
  id: string;
  name: string;
  iso_code: string;
}

export interface PublicCurrency {
  id: string;
  name: string;
  symbol: string;
}

export interface PublicTimezone {
  name: string;
}

export interface PublicRegistrationData {
  countries: PublicCountry[];
  languages: PublicLanguage[];
  currencies: PublicCurrency[];
  timezones: PublicTimezone[];
}

/**
 * Obtiene los datos públicos necesarios para el formulario de registro.
 * Llama a una función RPC de Supabase que no requiere autenticación.
 */
const fetchPublicRegistrationData = async (): Promise<PublicRegistrationData> => {
  const { data, error } = await supabase.rpc('get_public_registration_data');

  if (error) {
    console.error('Error fetching public registration data:', error);
    throw new Error(error.message);
  }

  // La función RPC devuelve un único objeto con todas las listas
  return data;
};

/**
 * Hook para acceder a los datos de registro públicos (países, monedas, etc.).
 * Utiliza react-query para cachear los datos y gestionar los estados de carga/error.
 */
export const usePublicRegistrationData = () => {
  return useQuery<PublicRegistrationData, Error>({
    queryKey: ['publicRegistrationData'],
    queryFn: fetchPublicRegistrationData,
    staleTime: 1000 * 60 * 60, // Cachear los datos durante 1 hora
    refetchOnWindowFocus: false, // No es necesario recargar en cada foco
  });
};

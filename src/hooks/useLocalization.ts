import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/hooks/use-toast';

// 'Language' ahora representa una Localización, ej. Español (Colombia)
export interface Localization {
  id: string;
  name: string;
  iso_code: string; // ej. es-CO
}

export interface Country {
  id: string;
  name: string;
  iso_code: string;
  default_currency_id?: string | null;
  default_localization_id?: string | null;
  default_timezone_id?: string | null;
  phone_prefix_id?: string | null;
  default_latitude?: number; // Añadido
  default_longitude?: number; // Añadido
  currencies?: { name: string; code: string };
  languages?: { name: string };
  phone_prefixes?: { prefix: string };
  timezones?: string[] | null;
  timezone?: string | null;
}



// Hook para obtener todas las localizaciones (antes idiomas)
export const useLocalizations = () => {
  return useQuery<Localization[], Error>({
    queryKey: ['localizations'],
    queryFn: async () => {
      const { data, error } = await supabase.from('languages').select('*').order('name');
      if (error) throw error;
      return data;
    },
  });
};

// Hook para crear una nueva localización
export const useCreateLocalization = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newLocalization: Omit<Localization, 'id'>) => {
      const { data, error } = await supabase.from('languages').insert(newLocalization).select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['localizations'] });
      toast({ title: 'Éxito', description: 'Localización creada.', variant: 'success' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
};

// Hook para actualizar una localización
export const useUpdateLocalization = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updatedLocalization: Partial<Localization> & { id: string }) => {
      const { id, ...updateData } = updatedLocalization;
      const { data, error } = await supabase.from('languages').update(updateData).eq('id', id);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['localizations'] });
      toast({ title: 'Éxito', description: 'Localización actualizada.', variant: 'success' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
};


// --- Hooks para Países ---

export const useCountries = () => {
  return useQuery<Country[], Error>({
    queryKey: ['countries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('countries')
        .select(`
          *,
          currencies!default_currency_id(name, code),
          languages!default_localization_id(name),
          phone_prefixes!phone_prefix_id(prefix)
        `)
        .order('name');
      if (error) throw error;
      return data;
    },
    select: (data) => data.map(country => ({
      ...country,
    })),
  });
};

export const useCreateCountry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newCountry: Omit<Country, 'id'>) => {
      const { data, error } = await supabase.from('countries').insert(newCountry).select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['countries'] });
      toast({ title: 'Éxito', description: 'País creado.', variant: 'success' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
};

export const useUpdateCountry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updatedCountry: Partial<Country> & { id: string }) => {
      const { id, ...updateData } = updatedCountry;
      const { data, error } = await supabase.from('countries').update(updateData).eq('id', id);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['countries'] });
      toast({ title: 'Éxito', description: 'País actualizado.', variant: 'success' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
};
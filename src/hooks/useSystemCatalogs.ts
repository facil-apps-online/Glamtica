import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/hooks/use-toast';
import { Currency, Country, Localization } from '@/types'; // Asumiendo que los tipos están centralizados

// --- CURRENCIES ---

/**
 * 1. Hook para OBTENER la lista de monedas (Read)
 * Llama a la acción 'get_currencies' de la Edge Function.
 */
const fetchCurrencies = async (searchTerm?: string) => {
  const { data, error } = await supabase.functions.invoke('superadmin-actions', {
    body: {
      action: 'get_currencies',
      payload: { searchTerm },
    },
  });
  if (error) throw new Error(error.message);
  return data as Currency[];
};

export const useCurrencies = (searchTerm?: string) => {
  return useQuery<Currency[], Error>({
    queryKey: ['currencies', searchTerm],
    queryFn: () => fetchCurrencies(searchTerm),
  });
};

/**
 * 2. Hook para CREAR una moneda (Create)
 * Llama a la acción 'create_currency' de la Edge Function.
 */
const createCurrency = async (newCurrency: Omit<Currency, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase.functions.invoke('superadmin-actions', {
    body: {
      action: 'create_currency',
      payload: newCurrency,
    },
  });
  if (error) throw new Error(error.message);
  return data;
};

export const useCreateCurrency = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCurrency,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currencies'] });
      toast({ title: 'Éxito', description: 'Moneda creada correctamente.', variant: 'success' });
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    },
  });
};

/**
 * 3. Hook para ACTUALIZAR una moneda (Update)
 * Llama a la acción 'update_currency' de la Edge Function.
 */
const updateCurrency = async ({ id, ...updateData }: Partial<Currency> & { id: string }) => {
    const { data, error } = await supabase.functions.invoke('superadmin-actions', {
        body: { action: 'update_currency', payload: { id, ...updateData } },
    });
    if (error) throw new Error(error.message);
    return data;
};

export const useUpdateCurrency = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateCurrency,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['currencies'] });
            toast({ title: 'Éxito', description: 'Moneda actualizada correctamente.', variant: 'success' });
        },
        onError: (error: Error) => {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        },
    });
};

/**
 * 4. Hook para ELIMINAR una moneda (Delete)
 * Llama a la acción 'delete_currency' de la Edge Function.
 */
const deleteCurrency = async (id: string) => {
    const { data, error } = await supabase.functions.invoke('superadmin-actions', {
        body: { action: 'delete_currency', payload: { id } },
    });
    if (error) throw new Error(error.message);
    return data;
};

export const useDeleteCurrency = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteCurrency,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['currencies'] });
            toast({ title: 'Éxito', description: 'Moneda eliminada correctamente.', variant: 'success' });
        },
        onError: (error: Error) => {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        },
    });
};

// --- COUNTRIES ---

/**
 * 1. Hook para OBTENER la lista de países (Read)
 * Llama a la acción 'get_countries' de la Edge Function.
 */
const fetchCountries = async (searchTerm?: string) => {
  const { data, error } = await supabase.functions.invoke('superadmin-actions', {
    body: {
      action: 'get_countries',
      payload: { searchTerm },
    },
  });
  if (error) throw new Error(error.message);
  return data as Country[];
};

export const useCountries = (searchTerm?: string) => {
  return useQuery<Country[], Error>({
    queryKey: ['countries', searchTerm],
    queryFn: () => fetchCountries(searchTerm),
  });
};

/**
 * 2. Hook para CREAR un país (Create)
 * Llama a la acción 'create_country' de la Edge Function.
 */
const createCountry = async (newCountry: Omit<Country, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase.functions.invoke('superadmin-actions', {
    body: {
      action: 'create_country',
      payload: newCountry,
    },
  });
  if (error) throw new Error(error.message);
  return data;
};

export const useCreateCountry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCountry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['countries'] });
      toast({ title: 'Éxito', description: 'País creado correctamente.', variant: 'success' });
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    },
  });
};

/**
 * 3. Hook para ACTUALIZAR un país (Update)
 * Llama a la acción 'update_country' de la Edge Function.
 */
const updateCountry = async ({ id, ...updateData }: Partial<Country> & { id: string }) => {
    const { data, error } = await supabase.functions.invoke('superadmin-actions', {
        body: { action: 'update_country', payload: { id, ...updateData } },
    });
    if (error) throw new Error(error.message);
    return data;
};

export const useUpdateCountry = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateCountry,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['countries'] });
            toast({ title: 'Éxito', description: 'País actualizado correctamente.', variant: 'success' });
        },
        onError: (error: Error) => {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        },
    });
};

/**
 * 4. Hook para ELIMINAR un país (Delete)
 * Llama a la acción 'delete_country' de la Edge Function.
 */
const deleteCountry = async (id: string) => {
    const { data, error } = await supabase.functions.invoke('superadmin-actions', {
        body: { action: 'delete_country', payload: { id } },
    });
    if (error) throw new Error(error.message);
    return data;
};

export const useDeleteCountry = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteCountry,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['countries'] });
            toast({ title: 'Éxito', description: 'País eliminado correctamente.', variant: 'success' });
        },
        onError: (error: Error) => {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        },
    });
};

// --- LANGUAGES (LOCALIZATIONS) ---

/**
 * 1. Hook para OBTENER la lista de localizaciones (Read)
 * Llama a la acción 'get_languages' de la Edge Function.
 */
const fetchLocalizations = async (searchTerm?: string) => {
  const { data, error } = await supabase.functions.invoke('superadmin-actions', {
    body: {
      action: 'get_languages',
      payload: { searchTerm },
    },
  });
  if (error) throw new Error(error.message);
  return data as Localization[];
};

export const useLocalizations = (searchTerm?: string) => {
  return useQuery<Localization[], Error>({
    queryKey: ['localizations', searchTerm],
    queryFn: () => fetchLocalizations(searchTerm),
  });
};

/**
 * 2. Hook para CREAR una localización (Create)
 * Llama a la acción 'create_language' de la Edge Function.
 */
const createLocalization = async (newLocalization: Omit<Localization, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase.functions.invoke('superadmin-actions', {
    body: {
      action: 'create_language',
      payload: newLocalization,
    },
  });
  if (error) throw new Error(error.message);
  return data;
};

export const useCreateLocalization = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createLocalization,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['localizations'] });
      toast({ title: 'Éxito', description: 'Localización creada correctamente.', variant: 'success' });
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    },
  });
};

/**
 * 3. Hook para ACTUALIZAR una localización (Update)
 * Llama a la acción 'update_language' de la Edge Function.
 */
const updateLocalization = async ({ id, ...updateData }: Partial<Localization> & { id: string }) => {
    const { data, error } = await supabase.functions.invoke('superadmin-actions', {
        body: { action: 'update_language', payload: { id, ...updateData } },
    });
    if (error) throw new Error(error.message);
    return data;
};

export const useUpdateLocalization = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateLocalization,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['localizations'] });
            toast({ title: 'Éxito', description: 'Localización actualizada correctamente.', variant: 'success' });
        },
        onError: (error: Error) => {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        },
    });
};

/**
 * 4. Hook para ELIMINAR una localización (Delete)
 * Llama a la acción 'delete_language' de la Edge Function.
 */
const deleteLocalization = async (id: string) => {
    const { data, error } = await supabase.functions.invoke('superadmin-actions', {
        body: { action: 'delete_language', payload: { id } },
    });
    if (error) throw new Error(error.message);
    return data;
};

export const useDeleteLocalization = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteLocalization,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['localizations'] });
            toast({ title: 'Éxito', description: 'Localización eliminada correctamente.', variant: 'success' });
        },
        onError: (error: Error) => {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        },
    });
};
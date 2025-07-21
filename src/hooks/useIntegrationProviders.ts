import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';

// Interfaces (sin cambios)
export interface ApiSchemaNode {
  id: string;
  key: string;
  type: 'object' | 'array' | 'string' | 'number' | 'boolean';
  glamticaMap: string;
  children?: ApiSchemaNode[];
}
export interface ConfigField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'password' | 'checkbox';
  required: boolean;
  helpText?: string;
  sandboxValue: string; 
}
export interface ApiEndpoints {
  test: string;
  production: string;
}
export interface IntegrationProvider {
  id: string;
  name: string;
  slug: string;
  logo_url: string; // Corregido: de logoUrl a logo_url
  country_id: string;
  category_id: string;
  status: 'active' | 'inactive';
  endpoints: ApiEndpoints;
  configSchema: ConfigField[];
  apiSchema: ApiSchemaNode[];
}

// Hook para obtener todos los proveedores (leyendo de la DB)
export const useIntegrationProviders = () => {
  return useQuery<IntegrationProvider[], Error>({
    queryKey: ['integrationProviders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('integration_providers')
        .select('*')
        .order('name');
      if (error) throw new Error(error.message);
      return data.map(p => ({
        ...p,
        endpoints: typeof p.endpoints === 'string' ? JSON.parse(p.endpoints) : p.endpoints,
        configSchema: p.config_schema, // Mapeo directo
        apiSchema: p.api_schema, // Mapeo directo
      })) as IntegrationProvider[];
    },
  });
};

// Hook para obtener un proveedor por ID (leyendo de la DB)
export const useIntegrationProvider = (id: string | undefined) => {
  return useQuery<IntegrationProvider | undefined, Error>({
    queryKey: ['integrationProvider', id],
    queryFn: async () => {
      if (!id) return undefined;
      const { data, error } = await supabase
        .from('integration_providers')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw new Error(error.message);
      if (!data) return undefined;
      return {
        ...data,
        endpoints: typeof data.endpoints === 'string' ? JSON.parse(data.endpoints) : data.endpoints,
        configSchema: data.config_schema,
        apiSchema: data.api_schema,
      } as IntegrationProvider;
    },
    enabled: !!id,
  });
};

// Hook para crear/actualizar un proveedor (escribiendo en la DB)
export const useUpsertIntegrationProvider = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (provider: Partial<IntegrationProvider>) => {
      // Mapeamos los nombres del frontend a los de la DB
      const { configSchema, apiSchema, ...rest } = provider;
      const providerToSave = {
        ...rest,
        config_schema: configSchema,
        api_schema: apiSchema,
      };

      const { data, error } = await supabase
        .from('integration_providers')
        .upsert(providerToSave)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (data, variables) => {
      toast({ title: `Proveedor ${variables.id ? 'actualizado' : 'creado'} con éxito.` });
      queryClient.invalidateQueries({ queryKey: ['integrationProviders'] });
      queryClient.invalidateQueries({ queryKey: ['integrationProvider', variables.id] });
    },
    onError: (error) => {
      toast({ title: 'Error al guardar', description: error.message, variant: 'destructive' });
    },
  });
};
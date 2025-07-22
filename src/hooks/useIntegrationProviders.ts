import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';

// --- Interfaces ---
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
export interface HttpHeader {
  id: string;
  name: string;
  value: string;
}
export interface IntegrationProvider {
  id: string;
  name: string;
  slug: string;
  logo_url: string;
  country_id: string;
  category_id: string;
  status: 'active' | 'inactive';
  endpoints: ApiEndpoints;
  configSchema: ConfigField[];
  apiSchema: ApiSchemaNode[];
  // Nuevos campos para la lógica de construcción de solicitudes
  http_method_id?: string;
  body_format_id?: string;
  auth_method_id?: string;
  http_headers?: HttpHeader[];
  authentication_config?: any;
  body_template?: string;
  response_mapping?: any;
}

// --- Hooks ---

// Hook para obtener todos los proveedores
export const useIntegrationProviders = () => {
  return useQuery<IntegrationProvider[], Error>({
    queryKey: ['integrationProviders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('integration_providers')
        .select('*')
        .order('name');
      if (error) throw new Error(error.message);
      // Mapeo para asegurar que los campos JSONB se parseen correctamente si es necesario
      return data.map(p => ({
        ...p,
        configSchema: p.config_schema,
        apiSchema: p.api_schema,
      })) as IntegrationProvider[];
    },
  });
};

// Hook para obtener un proveedor por ID
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
        configSchema: data.config_schema,
        apiSchema: data.api_schema,
      } as IntegrationProvider;
    },
    enabled: !!id,
  });
};

// Hook para crear/actualizar un proveedor
export const useUpsertIntegrationProvider = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (provider: Partial<IntegrationProvider>) => {
      // Mapeamos los nombres del frontend a los de la DB si es necesario
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
      queryClient.invalidateQueries({ queryKey: ['integrationProvider', data.id] });
    },
    onError: (error) => {
      toast({ title: 'Error al guardar', description: error.message, variant: 'destructive' });
    },
  });
};

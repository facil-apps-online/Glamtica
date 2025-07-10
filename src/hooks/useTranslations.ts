
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";

interface Language {
  id: string;
  code: string;
  name: string;
  native_name: string;
  is_active: boolean;
  is_default: boolean;
}

interface Translation {
  id: string;
  language_id: string;
  key: string;
  value: string;
  context?: string;
}

export const useLanguages = () => {
  return useQuery({
    queryKey: ['languages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('languages')
        .select('*')
        .eq('is_active', true)
        .order('is_default', { ascending: false });

      if (error) {
        throw error;
      }

      return data as Language[];
    },
  });
};

export const useTranslations = (languageCode?: string) => {
  return useQuery({
    queryKey: ['translations', languageCode],
    queryFn: async () => {
      let query = supabase
        .from('translations')
        .select(`
          *,
          languages(code, name)
        `);

      if (languageCode) {
        query = query.eq('languages.code', languageCode);
      }

      const { data, error } = await query.order('key');

      if (error) {
        throw error;
      }

      return data as (Translation & { languages: { code: string; name: string } })[];
    },
    enabled: !!languageCode,
  });
};

export const useTranslation = (languageCode: string = 'es') => {
  const { data: translations } = useTranslations(languageCode);
  
  const t = (key: string): string => {
    const translation = translations?.find(t => t.key === key);
    return translation?.value || key;
  };

  return { t };
};

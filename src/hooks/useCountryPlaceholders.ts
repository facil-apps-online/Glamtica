import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";

export interface PhonePlaceholder {
  label: string;
  value: string;
}

const fetchCountryPlaceholders = async (countryIsoCode: string): Promise<PhonePlaceholder[] | null> => {
  if (!countryIsoCode) {
    return null;
  }

  const { data, error } = await supabase
    .from("countries")
    .select("field_placeholders")
    .eq("iso_code", countryIsoCode)
    .single();

  if (error) {
    console.error("Error fetching country placeholders:", error);
    return null;
  }

  return data?.field_placeholders?.phone || null;
};

export const useCountryPlaceholders = (countryId?: string | null) => {
  return useQuery<PhonePlaceholder[] | null, Error>({
    queryKey: ["countryPlaceholders", countryId],
    queryFn: () => fetchCountryPlaceholders(countryId!),
    enabled: !!countryId,
  });
};

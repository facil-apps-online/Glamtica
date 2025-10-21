import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";

const fetchTenantCountry = async (tenantId: string): Promise<string | null> => {
  if (!tenantId) {
    return null;
  }

  const { data, error } = await supabase
    .from("tenants")
    .select("country_id")
    .eq("id", tenantId)
    .single();

  if (error) {
    console.error("Error fetching tenant country:", error);
    return null;
  }

  return data?.country_id || null;
};

export const useTenantCountry = (tenantId?: string | null) => {
  return useQuery<string | null, Error>({
    queryKey: ["tenantCountry", tenantId],
    queryFn: () => fetchTenantCountry(tenantId!),
    enabled: !!tenantId,
  });
};

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

const fetchInformedConsent = async (accessToken: string, attentionId: string) => {
  if (!attentionId || !accessToken) return null;

  const response = await fetch(`${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/tenant-actions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      action: 'get_informed_consent_details',
      payload: { attention_id: attentionId },
    }),
  });

  const json = await response.json();

  if (!response.ok) {
    throw new Error(json.error || 'Failed to fetch informed consent details');
  }
  
  return json;
};

export const useInformedConsent = (attentionId: string | undefined) => {
  const { session } = useAuth();

  return useQuery({
    queryKey: ['informedConsent', attentionId],
    queryFn: () => fetchInformedConsent(session!.access_token, attentionId!),
    enabled: !!attentionId && !!session,
  });
};

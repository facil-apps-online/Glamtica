import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

export interface AttentionService {
  id: string;
  service_id: string;
  service_name: string; // From join
  attention_service_evidences: { // New nested evidences
    id: string;
    google_drive_file_id: string;
    file_name: string;
    mime_type: string;
  }[];
}

// AttentionEvidence interface is removed

export interface ClientDocumentInstance {
  id: string;
  created_at: string;
  client_id: string;
  attention_id: string;
  template_id: string;
  data: any;
  signed_content: string;
  signature_data: string;
  signature_file_id: string;
  template: {
    name: string;
    schema: any;
    version: number;
  };
}

export interface Attention {
  id: string;
  attention_datetime: string;
  status: string;
  attention_services: AttentionService[];
  // attention_evidences is removed from here
  client_document_instances: ClientDocumentInstance[];
}

interface GetClientAttentionsResponse {
  attentions: Attention[];
  count: number;
  page: number;
  page_size: number;
}

const fetchClientAttentions = async (
  clientId: string,
  token: string,
  page: number,
  pageSize: number
): Promise<GetClientAttentionsResponse> => {
  const response = await fetch(`${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/tenant-actions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      action: 'get-client-attentions',
      payload: { client_id: clientId, page, page_size: pageSize },
    }),
  });

  const json = await response.json();
  if (!response.ok) {
    throw new Error(json.error || 'Failed to fetch client attentions');
  }
  return json;
};

export const useClientAttentions = (clientId: string, page: number, pageSize: number) => {
  const { session } = useAuth();
  const token = session?.access_token;

  return useQuery<GetClientAttentionsResponse, Error>({
    queryKey: ['clientAttentions', clientId, page, pageSize],
    queryFn: () => fetchClientAttentions(clientId, token!, page, pageSize),
    enabled: !!clientId && !!token,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
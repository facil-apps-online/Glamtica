import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { fetchTenantAction } from '@/lib/fetchTenantAction';

export interface PaymentEvidence {
  id: string;
  file_name: string;
  google_drive_file_id: string;
}

const fetchPaymentEvidence = async (attentionPaymentIds: string[]): Promise<PaymentEvidence[]> => {
  if (!attentionPaymentIds || attentionPaymentIds.length === 0) return [];
  return fetchTenantAction('get_payment_evidences', { attentionPaymentIds });
};

export const usePaymentEvidence = (attentionPaymentIds: string[]) => {
  return useQuery({
    queryKey: ['payment_evidence', attentionPaymentIds],
    queryFn: () => fetchPaymentEvidence(attentionPaymentIds),
    enabled: !!attentionPaymentIds && attentionPaymentIds.length > 0,
  });
};

interface UploadEvidencePayload {
  file: File;
  attentionPaymentId: string;
  tenantId: string;
  branchId: string;
  userId: string;
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = (reader.result as string).split(',')[1];
      resolve(result);
    };
    reader.onerror = (error) => reject(error);
  });
};


const uploadEvidence = async (payload: UploadEvidencePayload) => {
  const { file, attentionPaymentId, tenantId, branchId, userId } = payload;

  const fileBase64 = await fileToBase64(file);

  const { data, error } = await supabase.functions.invoke('google-drive-upload', {
    body: {
      tenantId,
      fileBase64,
      mimeType: file.type,
      fileName: file.name,
      uploadContext: 'PaymentEvidence',
      contextId: attentionPaymentId,
      branchId,
      userId,
    },
  });

  if (error) {
    throw new Error(`Error uploading payment evidence: ${error.message}`);
  }

  return data;
};

export const useUploadPaymentEvidence = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (payload: Omit<UploadEvidencePayload, 'userId'>) => {
        if (!user) throw new Error('User not authenticated');
        return uploadEvidence({ ...payload, userId: user.id });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['payment_evidence', variables.attentionPaymentId] });
    },
  });
};
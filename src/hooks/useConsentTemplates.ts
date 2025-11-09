import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

// Type for consent templates
export interface ConsentTemplate {
  id: string;
  name: string;
  content?: string;
  fields?: any; // Or a more specific type for your fields
  is_active: boolean;
  tenant_id: string;
}

// Hook to GET all consent templates
export const useConsentTemplates = () => {
  const fetchTemplates = async () => {
    const { data, error } = await supabase.functions.invoke('tenant-actions', {
      body: { action: 'list_consent_templates' },
    });

    if (error) throw new Error(error.message);
    
    return data as ConsentTemplate[];
  };

  return useQuery<ConsentTemplate[]>({
    queryKey: ['consentTemplates'],
    queryFn: fetchTemplates,
  });
};

// Hook to CREATE a consent template
export const useCreateConsentTemplate = () => {
  const queryClient = useQueryClient();

  const createTemplate = async (templateData: Pick<ConsentTemplate, 'name' | 'content' | 'fields'>) => {
    const { data, error } = await supabase.functions.invoke('tenant-actions', {
      body: { 
        action: 'create_consent_template',
        payload: templateData
      },
    });

    if (error) throw new Error(error.message);
    return data;
  };

  return useMutation({ 
    mutationFn: createTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consentTemplates'] });
    }
  });
};

// Hook to UPDATE a consent template
export const useUpdateConsentTemplate = () => {
  const queryClient = useQueryClient();

  const updateTemplate = async (updates: Partial<ConsentTemplate> & { id: string }) => {
    const { data, error } = await supabase.functions.invoke('tenant-actions', {
      body: { 
        action: 'update_consent_template',
        payload: updates
      },
    });

    if (error) throw new Error(error.message);
    return data;
  };

  return useMutation({ 
    mutationFn: updateTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consentTemplates'] });
    }
  });
};

// Hook to TOGGLE the status of a consent template
export const useToggleConsentTemplateStatus = () => {
  const queryClient = useQueryClient();

  const toggleStatus = async ({ id }: { id: string }) => {
    const { data, error } = await supabase.functions.invoke('tenant-actions', {
      body: { 
        action: 'toggle_consent_template_status',
        payload: { id }
      },
    });

    if (error) throw new Error(error.message);
    return data;
  };

  return useMutation({ 
    mutationFn: toggleStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consentTemplates'] });
    }
  });
};

// Type for signed consents
export interface SignedConsent {
  id: string;
  attention_id: string;
  client_id: string;
  professional_id: string;
  template_id: string;
  template_name: string;
  template_content: string;
  professional_observations: string | null;
  signed_content: string | null;
  signed_at: string | null;
  created_at: string;
  updated_at: string;
  attention_service_id: string | null;
  signature_file_id: string | null;
}

// Hook to GET signed consents for a specific attention or service item
export const useSignedConsentsForAttention = (attentionId: string | undefined, attentionServiceId?: string | undefined) => {
  const fetchSignedConsents = async () => {
    if (!attentionId) return [];

    const payload: { attention_id: string; attention_service_id?: string } = { attention_id: attentionId };
    if (attentionServiceId) {
      payload.attention_service_id = attentionServiceId;
    }

    const { data, error } = await supabase.functions.invoke('tenant-actions', {
      body: { action: 'get_signed_consents_for_attention', payload: payload },
    });

    if (error) throw new Error(error.message);
    return data as SignedConsent[];
  };

  return useQuery<SignedConsent[]>({ 
    queryKey: ['signedConsentsForAttention', attentionId, attentionServiceId], // Updated queryKey
    queryFn: fetchSignedConsents,
    enabled: !!attentionId,
  });
};

// Hook to ASSIGN a consent template to a service item
export const useAssignConsentToService = () => {
  const queryClient = useQueryClient();

  const assignConsent = async ({ attentionId, templateId, attentionServiceId, professionalObservations }: { attentionId: string, templateId: string, attentionServiceId: string, professionalObservations?: string }) => {
    const { data, error } = await supabase.functions.invoke('tenant-actions', {
      body: {
        action: 'assign_consent_to_service',
        payload: { 
          attention_id: attentionId, 
          template_id: templateId, 
          attention_service_id: attentionServiceId,
          professional_observations: professionalObservations 
        },
      },
    });

    if (error) throw new Error(error.message);
    return data;
  };

  return useMutation({
    mutationFn: assignConsent,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['signedConsentsForAttention', variables.attentionId] });
    },
  });
};

// Hook to DELETE a signed consent
export const useDeleteSignedConsent = () => {
  const queryClient = useQueryClient();

  const deleteConsent = async (signedConsentId: string) => {
    const { data, error } = await supabase.functions.invoke('tenant-actions', {
      body: {
        action: 'delete_signed_consent',
        payload: { signed_consent_id: signedConsentId },
      },
    });

    if (error) throw new Error(error.message);
    return data;
  };

  return useMutation({
    mutationFn: deleteConsent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['signedConsentsForAttention'] });
    },
  });
};

// Hook to SIGN a consent
export const useSignConsent = () => {
  const queryClient = useQueryClient();
  const { currentAssignment, user } = useAuth();

  const signConsent = async ({ signedConsentId, signatureDataUrl, observations, branchId, formData, signedContent }: { signedConsentId: string, signatureDataUrl: string, observations: string, branchId: string, formData: any, signedContent: string }) => {
    if (!currentAssignment || !user) {
      throw new Error("User is not authenticated or has no assignment.");
    }
    
    // 1. Upload signature to Google Drive
    const base64Data = signatureDataUrl.split(',')[1];
    const { data: uploadData, error: uploadError } = await supabase.functions.invoke('google-drive-upload', {
      body: {
        fileBase64: base64Data,
        mimeType: 'image/png',
        fileName: `consent_signature_${signedConsentId}.png`,
        uploadContext: 'ConsentSignature',
        contextId: signedConsentId,
        tenantId: currentAssignment.tenant_id,
        branchId: branchId,
        userId: user.id,
      },
    });

    if (uploadError) {
      throw new Error(`Error uploading signature: ${uploadError.message}`);
    }

    // 2. Link signature to consent
    const { error: linkError } = await supabase.functions.invoke('tenant-actions', {
      body: {
        action: 'link_signature_to_consent',
        payload: {
          signed_consent_id: signedConsentId,
          observations: observations,
          form_data: formData,
          signed_content: signedContent,
        },
      },
    });

    if (linkError) {
      // TODO: Consider deleting the file from Google Drive if linking fails
      throw new Error(`Error linking signature: ${linkError.message}`);
    }

    return uploadData;
  };

  return useMutation({
    mutationFn: signConsent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['signedConsentsForAttention'] });
    },
  });
};

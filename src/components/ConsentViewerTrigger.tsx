import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { ClientDocumentInstance } from '@/hooks/useClientAttentions';
import { ExportInformedConsentDialog } from '@/components/attentions/ExportInformedConsentDialog';
import { SignedConsent } from '@/hooks/useConsentTemplates'; // Import the SignedConsent interface

interface ConsentViewerTriggerProps {
  documentInstance: ClientDocumentInstance;
}

export const ConsentViewerTrigger: React.FC<ConsentViewerTriggerProps> = ({ documentInstance }) => {
  const [open, setOpen] = useState(false);

  // Map ClientDocumentInstance to SignedConsent
  const signedConsent: SignedConsent = {
    id: documentInstance.id,
    attention_id: documentInstance.attention_id,
    client_id: documentInstance.client_id,
    template_id: documentInstance.template_id,
    signed_at: documentInstance.created_at, // Using created_at as signed_at for display
    signature_data: documentInstance.signature_data,
    signature_file_id: documentInstance.signature_file_id,
    metadata: documentInstance.data, // Using data as metadata for now
    signed_content: documentInstance.signed_content,
    template: documentInstance.template,
  };

  // Create a minimal attention object for ExportInformedConsentDialog
  const minimalAttention = {
    id: documentInstance.attention_id,
    client_id: documentInstance.client_id,
    // Add any other minimal properties if ExportInformedConsentDialog starts using them
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="justify-start">
        <FileText className="w-4 h-4 mr-2" />
        {documentInstance.template?.name || 'Consentimiento Informado'}
      </Button>
      <ExportInformedConsentDialog
        open={open}
        onOpenChange={setOpen}
        signedConsent={signedConsent}
        attention={minimalAttention}
      />
    </>
  );
};

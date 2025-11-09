import React, { useState, useMemo, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SignedConsent } from '@/hooks/useConsentTemplates';
import { useAuth } from '@/contexts/AuthContext';
import { useClientDetails } from '@/hooks/useClients';
import { useTenantUsers } from '@/hooks/useTenantUsers';
import { useBranches } from '@/hooks/useBranches';
import { SignConsentDialog } from './SignConsentDialog';
import { DynamicFormRenderer } from '../DynamicFormRenderer';

interface ViewConsentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (signatureDataUrl: string, observations: string, formData: any, signedContent: string) => void;
  signedConsent: SignedConsent | null;
  isSigning?: boolean;
  attention: any;
}

export const ViewConsentDialog: React.FC<ViewConsentDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  signedConsent,
  isSigning = false,
  attention,
}) => {
  const [isSignatureDialogOpen, setIsSignatureDialogOpen] = useState(false);
  const { currentAssignment } = useAuth();
  const { data: client } = useClientDetails(signedConsent?.client_id || '');
  const { data: users } = useTenantUsers();
  const { data: branches } = useBranches();
  const [formData, setFormData] = useState<any>({});
  const contentRef = useRef<HTMLDivElement>(null);

  const professionalObservations = signedConsent?.professional_observations || '';

  const processedContent = useMemo(() => {
    if (!signedConsent?.template_content || !currentAssignment || !client || !users || !attention || !branches) {
      return signedConsent?.template_content || '';
    }

    const professional = users.find(u => u.user_id === signedConsent.professional_id);
    const professionalName = professional ? `${professional.first_name || ''} ${professional.last_name || ''}`.trim() : '';

    const attentionBranch = branches.find(b => b.id === attention.branch_id);
    const branchName = attentionBranch?.name || '';

    const replacements: Record<string, string> = {
      '{{nombre_negocio}}': currentAssignment.tenant_name || '',
      '{{nombre_sucursal}}': branchName,
      '{{nombre_cliente}}': client.name || '',
      '{{tipo_documento_cliente}}': client.document_types?.name || '',
      '{{numero_documento_cliente}}': client.document_number || '',
      '{{nombre_profesional}}': professionalName,
      '{{fecha_actual}}': new Date().toLocaleDateString(),
      '{{observaciones_profesional}}': professionalObservations,
    };

    let content = signedConsent.template_content;
    for (const placeholder in replacements) {
      content = content.replace(new RegExp(placeholder, 'g'), replacements[placeholder]);
    }

    return content;
  }, [signedConsent, currentAssignment, client, users, attention, branches, professionalObservations]);

  const handleSign = (signatureDataUrl: string) => {
    const signedContent = contentRef.current?.innerHTML || '';
    onConfirm(signatureDataUrl, professionalObservations, formData, signedContent);
    setIsSignatureDialogOpen(false);
  };

  if (!signedConsent) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-4xl lg:max-w-6xl h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Revisar Consentimiento Informado</DialogTitle>
            <DialogDescription>
              Estás a punto de firmar el consentimiento: <strong>{signedConsent.template_name}</strong>.
              Por favor, lee el contenido y las observaciones, y luego procede a firmar.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-grow prose max-w-none border rounded-md p-4 overflow-y-auto" ref={contentRef}>
            <div dangerouslySetInnerHTML={{ __html: processedContent }} />
            {signedConsent.template_fields && (
              <div className="mt-4">
                <DynamicFormRenderer
                  schema={signedConsent.template_fields}
                  formData={formData}
                  onFormChange={setFormData}
                  readOnly={false}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSigning}>Cancelar</Button>
            <Button onClick={() => setIsSignatureDialogOpen(true)} disabled={isSigning}>
              Proceder a Firmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SignConsentDialog
        open={isSignatureDialogOpen}
        onOpenChange={setIsSignatureDialogOpen}
        onConfirm={handleSign}
        isSigning={isSigning}
      />
    </>
  );
};

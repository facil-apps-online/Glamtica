import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SignaturePad } from "@/components/SignaturePad";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useSaveClientConsentRecord } from '@/hooks/useClientConsentRecords';
import { ClientConsentRecord } from '@/hooks/useClientConsentRecords';
import { useScreenSize } from '@/hooks/useScreenSize';

interface ConsentManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  initialSignatureData?: string;
  initialImageConsent?: boolean;
  requireGeneralSignature: boolean;
  requireImageConsent: boolean;
}

export const ConsentManagerDialog: React.FC<ConsentManagerDialogProps> = ({
  open,
  onOpenChange,
  clientId,
  initialSignatureData,
  initialImageConsent,
  requireGeneralSignature,
  requireImageConsent,
}) => {
  const { toast } = useToast();
  const { mutate: saveConsentRecord, isLoading: isSavingConsent } = useSaveClientConsentRecord();
  const screenSize = useScreenSize();
  const isMobile = screenSize === 'sm' || screenSize === 'md';

  const [signatureData, setSignatureData] = useState<string | undefined>(initialSignatureData);
  const [imageConsent, setImageConsent] = useState<boolean>(initialImageConsent ?? false);

  useEffect(() => {
    setSignatureData(initialSignatureData);
    setImageConsent(initialImageConsent ?? false);
  }, [initialSignatureData, initialImageConsent]);

  const handleSaveConsents = () => {
    if (!clientId) {
      toast({ title: "Error", description: "Cliente no identificado para guardar consentimientos.", variant: "destructive" });
      return;
    }

    const consentsToSave: Pick<ClientConsentRecord, 'client_id' | 'consent_type' | 'signature_data' | 'metadata'>[] = [];

    if (requireGeneralSignature && signatureData) {
      consentsToSave.push({
        client_id: clientId,
        consent_type: 'general_signature',
        signature_data: signatureData,
        metadata: {},
      });
    }

    if (requireImageConsent) {
      consentsToSave.push({
        client_id: clientId,
        consent_type: 'image_use',
        signature_data: null, // No signature for image consent
        metadata: { consented: imageConsent },
      });
    }

    if (consentsToSave.length === 0) {
      toast({ title: "Información", description: "No hay consentimientos para guardar.", variant: "default" });
      onOpenChange(false);
      return;
    }

    // Guardar cada consentimiento individualmente o en un batch si la API lo permite
    // Por simplicidad, aquí se guardan uno por uno. Podrías extender la Edge Function para un batch.
    let savedCount = 0;
    let errorCount = 0;

    consentsToSave.forEach(consent => {
      saveConsentRecord(consent, {
        onSuccess: () => {
          savedCount++;
          if (savedCount + errorCount === consentsToSave.length) {
            if (errorCount === 0) {
              toast({ title: "Éxito", description: "Consentimientos guardados correctamente.", variant: "success" });
              onOpenChange(false);
            } else {
              toast({ title: "Advertencia", description: `Se guardaron ${savedCount} de ${consentsToSave.length} consentimientos.`, variant: "warning" });
            }
          }
        },
        onError: (error: any) => {
          errorCount++;
          toast({ title: "Error", description: `Error al guardar consentimiento ${consent.consent_type}: ${error.message}`, variant: "destructive" });
          if (savedCount + errorCount === consentsToSave.length) {
            toast({ title: "Advertencia", description: `Se guardaron ${savedCount} de ${consentsToSave.length} consentimientos.`, variant: "warning" });
          }
        },
      });
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gestionar Consentimientos</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          {requireGeneralSignature && (
            <div className="space-y-2">
              <Label htmlFor="general-signature-pad">Firma General del Cliente</Label>
              <SignaturePad
                id="general-signature-pad"
                data={signatureData}
                onSave={(data) => setSignatureData(data)}
                isMobile={isMobile}
              />
            </div>
          )}

          {requireImageConsent && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="image-consent-checkbox"
                checked={imageConsent}
                onCheckedChange={setImageConsent}
              />
              <Label htmlFor="image-consent-checkbox">El cliente otorga consentimiento para el uso de imágenes.</Label>
            </div>
          )}

          {!requireGeneralSignature && !requireImageConsent && (
            <p className="text-sm text-slate-500">No hay consentimientos configurados para este tenant.</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSaveConsents} disabled={isSavingConsent}>
            {isSavingConsent ? "Guardando..." : "Guardar Consentimientos"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
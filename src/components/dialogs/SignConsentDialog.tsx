import React, { useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SignaturePad } from '@/components/SignaturePad';
import { Loader2 } from 'lucide-react';

interface SignConsentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (signatureDataUrl: string) => void;
  isSigning?: boolean;
}

export const SignConsentDialog: React.FC<SignConsentDialogProps> = ({ 
  open, 
  onOpenChange, 
  onConfirm,
  isSigning = false,
}) => {
  const signaturePadRef = useRef<any>(null);

  const handleConfirm = () => {
    if (signaturePadRef.current && !signaturePadRef.current.isEmpty()) {
      const signatureDataUrl = signaturePadRef.current.toDataURL();
      onConfirm(signatureDataUrl);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Firma Digital</DialogTitle>
          <DialogDescription>
            Por favor, firma en el recuadro de abajo para confirmar tu consentimiento.
          </DialogDescription>
        </DialogHeader>
        
        <div className="border rounded-md w-full aspect-video bg-gray-50">
          <SignaturePad ref={signaturePadRef} />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSigning}>Cancelar</Button>
          <Button onClick={handleConfirm} disabled={isSigning}>
            {isSigning ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Firmando...</> : 'Confirmar Firma'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
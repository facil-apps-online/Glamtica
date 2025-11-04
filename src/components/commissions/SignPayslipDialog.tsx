import React, { useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SignaturePad } from '@/components/SignaturePad';
import { Payslip } from '@/hooks/usePayslips';
import { usePriceFormat } from '@/hooks/usePriceFormat';
import { Loader2 } from 'lucide-react';

interface SignPayslipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (signatureDataUrl: string) => void;
  payslip: Payslip | null;
  isSigning?: boolean;
}

export const SignPayslipDialog: React.FC<SignPayslipDialogProps> = ({ 
  open, 
  onOpenChange, 
  onConfirm,
  payslip,
  isSigning = false,
}) => {
  const signaturePadRef = useRef<any>(null);
  const { formatPrice } = usePriceFormat();

  const handleConfirm = () => {
    if (signaturePadRef.current && !signaturePadRef.current.isEmpty()) {
      const signatureDataUrl = signaturePadRef.current.toDataURL();
      onConfirm(signatureDataUrl);
    }
  };

  if (!payslip) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Revisar y Firmar Liquidación</DialogTitle>
          <DialogDescription>
            Estás a punto de confirmar el recibo de una liquidación por un total de <strong>{formatPrice(payslip.total_amount)}</strong>.
            Por favor, firma en el recuadro de abajo para confirmar.
          </DialogDescription>
        </DialogHeader>
        
        <div className="border rounded-md w-full aspect-video bg-gray-50">
          <SignaturePad ref={signaturePadRef} />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSigning}>Cancelar</Button>
          <Button onClick={handleConfirm} disabled={isSigning}>
            {isSigning ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Firmando...</> : 'Confirmar y Firmar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

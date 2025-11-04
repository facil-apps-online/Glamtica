import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface VoidCommissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
  commissionAmount: number;
}

export const VoidCommissionDialog: React.FC<VoidCommissionDialogProps> = ({ 
  open, 
  onOpenChange, 
  onConfirm,
  commissionAmount
}) => {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    if (reason.trim()) {
      onConfirm(reason);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Anular ComisiÃ³n</DialogTitle>
          <DialogDescription>
            EstÃ¡s a punto de anular una comisiÃ³n por un monto de <strong>${commissionAmount.toFixed(2)}</strong>.
            <br />
            Por favor, ingresa el motivo de la anulaciÃ³n. El profesional serÃ¡ notificado.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="reason">Motivo</Label>
          <Textarea 
            id="reason" 
            value={reason} 
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ej: Se aplicÃ³ un descuento post-venta, el cliente devolviÃ³ el producto, etc."
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleConfirm} disabled={!reason.trim()}>Confirmar AnulaciÃ³n</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

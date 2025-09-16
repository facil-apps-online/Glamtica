import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useCreatePaymentMethod } from '@/hooks/useCreatePaymentMethod';
import { useUpdatePaymentMethod } from '@/hooks/useUpdatePaymentMethod';
import { PaymentMethod } from '@/hooks/usePaymentMethods';

interface PaymentMethodDialogProps {
  isOpen: boolean;
  onClose: () => void;
  paymentMethod?: PaymentMethod | null;
  tenantId: string; // Added tenantId prop
}

export const PaymentMethodDialog: React.FC<PaymentMethodDialogProps> = ({ isOpen, onClose, paymentMethod, tenantId }) => { // Destructure tenantId
  const [name, setName] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [requiresEvidence, setRequiresEvidence] = useState(false);
  const createPaymentMethodMutation = useCreatePaymentMethod(tenantId); // Pass tenantId
  const updatePaymentMethodMutation = useUpdatePaymentMethod(tenantId); // Pass tenantId

  useEffect(() => {
    if (paymentMethod) {
      setName(paymentMethod.name);
      setIsActive(paymentMethod.is_active);
      setRequiresEvidence(paymentMethod.requires_evidence);
    } else {
      setName('');
      setIsActive(true);
      setRequiresEvidence(false);
    }
  }, [paymentMethod, isOpen]);

  const handleSubmit = () => {
    if (paymentMethod) {
      updatePaymentMethodMutation.mutate({ id: paymentMethod.id, name, is_active: isActive, requires_evidence: requiresEvidence }, {
        onSuccess: () => {
          onClose();
        }
      });
    } else {
      createPaymentMethodMutation.mutate({ name, is_active: isActive, requires_evidence: requiresEvidence }, {
        onSuccess: () => {
          onClose();
        }
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{paymentMethod ? 'Editar' : 'Agregar'} Medio de Pago</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="is_active" checked={isActive} onCheckedChange={setIsActive} />
            <Label htmlFor="is_active">Activo</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="requires_evidence" checked={requiresEvidence} onCheckedChange={setRequiresEvidence} />
            <Label htmlFor="requires_evidence">Requiere Evidencia</Label>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose} variant="outline">Cancelar</Button>
          <Button onClick={handleSubmit} disabled={createPaymentMethodMutation.isPending || updatePaymentMethodMutation.isPending}>
            {createPaymentMethodMutation.isPending || updatePaymentMethodMutation.isPending ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
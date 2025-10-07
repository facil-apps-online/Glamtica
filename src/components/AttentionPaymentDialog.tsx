import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAttentionPayment } from '@/hooks/useAttentionPayment';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { usePriceFormat } from '@/hooks/usePriceFormat';
import { PaymentEvidenceUploadDialog } from './PaymentEvidenceUploadDialog';
import { useAuth } from '@/contexts/AuthContext';
import { ReceiptDialog } from './ReceiptDialog';
import { CheckCircle2 } from 'lucide-react';
import { useSaleDetails, SaleDetails } from '@/hooks/useSaleDetails';

// Interfaces...
interface AttentionData {
  id: string;
  total_amount: number;
  branch_id: string;
}

interface AttentionPaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  attention: AttentionData | null;
}

interface PaymentMethodItem {
  id: string;
  method_id: string;
  amount: number;
}

interface AttentionPaymentRecord {
    id: string;
    payment_method_id: string;
}

export const AttentionPaymentDialog: React.FC<AttentionPaymentDialogProps> = ({ isOpen, onClose, attention }) => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<'value' | 'percentage'>('value');
  const [remainingAmount, setRemainingAmount] = useState(attention?.total_amount || 0);
  const { tenantId } = useAuth();
  const { data: availablePaymentMethods = [] } = usePaymentMethods(tenantId);
  const { formatPrice } = usePriceFormat();
  
  const [paymentState, setPaymentState] = useState<'paying' | 'uploading_evidence' | 'completed'>('paying');
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);
  const [completedSaleId, setCompletedSaleId] = useState<string | null>(null);

  const [paymentsRequiringEvidence, setPaymentsRequiringEvidence] = useState<AttentionPaymentRecord[]>([]);
  const [currentEvidencePayment, setCurrentEvidencePayment] = useState<AttentionPaymentRecord | null>(null);

  const paymentMutation = useAttentionPayment();
  
  // Use the query hook, but only enable it when the dialog is open
  const { data: saleData, isLoading: isSaleDataLoading } = useSaleDetails(
    isReceiptDialogOpen ? completedSaleId : null
  );

  const resetState = () => {
    setPaymentState('paying');
    setPaymentMethods([]);
    setDiscount(0);
    setDiscountType('value');
    setPaymentsRequiringEvidence([]);
    setCurrentEvidencePayment(null);
    setCompletedSaleId(null);
    setIsReceiptDialogOpen(false);
  };

  useEffect(() => {
    if (attention) {
      resetState();
      setRemainingAmount(attention.total_amount);
    } else {
      resetState();
    }
  }, [attention, isOpen]);

  useEffect(() => {
    if (attention) {
      updateRemainingAmount(paymentMethods);
    }
  }, [discount, discountType, paymentMethods, attention]);

  const handleAddPaymentMethod = () => {
    if (availablePaymentMethods.length === 0) return;
    const newPaymentMethod: PaymentMethodItem = {
      id: new Date().toISOString(),
      method_id: availablePaymentMethods[0].id,
      amount: remainingAmount > 0 ? remainingAmount : 0,
    };
    const updatedMethods = [...paymentMethods, newPaymentMethod];
    setPaymentMethods(updatedMethods);
  };

  const handlePaymentMethodChange = (id: string, field: keyof PaymentMethodItem, value: string | number) => {
    const updatedMethods = paymentMethods.map(p => (p.id === id ? { ...p, [field]: value } : p));
    setPaymentMethods(updatedMethods);
  };

  const updateRemainingAmount = (methods: PaymentMethodItem[]) => {
    if (!attention) return;
    const totalPaid = methods.reduce((sum, p) => sum + p.amount, 0);
    const discountAmount = discountType === 'percentage' ? (attention.total_amount * discount) / 100 : discount;
    setRemainingAmount(attention.total_amount - totalPaid - discountAmount);
  };

  const handlePay = () => {
    if (!attention) return;

    const discountAmount = discountType === 'percentage' ? (attention.total_amount * discount) / 100 : discount;

    const paymentOptions = {
      payment_methods: paymentMethods.map(p => ({
        method: availablePaymentMethods.find(apm => apm.id === p.method_id)?.name.toLowerCase() || '',
        amount: p.amount,
        method_id: p.method_id,
      })),
      discount: discountAmount,
    };

    paymentMutation.mutate({ 
      attention, 
      paymentOptions
    }, {
        onSuccess: (data) => {
            if (data) {
              const { createdPayments, saleId } = data;
              setCompletedSaleId(saleId);

              const requiringEvidence = createdPayments.filter(p => 
                  availablePaymentMethods.find(apm => apm.id === p.payment_method_id)?.requires_evidence
              );
  
              if (requiringEvidence.length > 0) {
                  setPaymentsRequiringEvidence(requiringEvidence);
                  setCurrentEvidencePayment(requiringEvidence[0]);
                  setPaymentState('uploading_evidence');
              } else {
                  setPaymentState('completed');
              }
            }
        }
    });
  };

  const handleUploadComplete = () => {
    const currentIndex = paymentsRequiringEvidence.findIndex(p => p.id === currentEvidencePayment?.id);
    const nextIndex = currentIndex + 1;

    if (nextIndex < paymentsRequiringEvidence.length) {
        setCurrentEvidencePayment(paymentsRequiringEvidence[nextIndex]);
    } else {
        setPaymentState('completed');
    }
  }

  const handleCloseDialog = () => {
    resetState();
    onClose();
  }

  if (!attention) return null;

  const totalPaid = paymentMethods.reduce((sum, p) => sum + p.amount, 0);
  const totalWithDiscount = attention.total_amount - (discountType === 'percentage' ? (attention.total_amount * discount) / 100 : discount);
  const change = totalPaid - totalWithDiscount;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {paymentState === 'completed' ? 'Pago Completado' : 'Registrar Pago de Atención'}
            </DialogTitle>
          </DialogHeader>
          
          {paymentState === 'paying' && (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-lg font-semibold">Total a Pagar</p>
                <p className="text-3xl font-bold">{formatPrice(totalWithDiscount)}</p>
              </div>

              <div className="flex items-center space-x-2">
                <div className="w-2/3">
                  <Label htmlFor="discount">Descuento</Label>
                  <Input
                    id="discount"
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    className="w-full"
                  />
                </div>
                <div className="w-1/3">
                  <Label>&nbsp;</Label>
                  <Select value={discountType} onValueChange={(value) => setDiscountType(value as 'value' | 'percentage')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="value">Valor</SelectItem>
                      <SelectItem value="percentage">Porcentaje</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {paymentMethods.map((payment) => (
                <div key={payment.id} className="flex items-center space-x-2">
                  <Select
                    value={payment.method_id}
                    onValueChange={(value) => handlePaymentMethodChange(payment.id, 'method_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Método de pago" />
                    </SelectTrigger>
                    <SelectContent>
                      {availablePaymentMethods.map(method => (
                        <SelectItem key={method.id} value={method.id}>{method.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    value={payment.amount}
                    onChange={(e) => handlePaymentMethodChange(payment.id, 'amount', parseFloat(e.target.value) || 0)}
                    className="w-full"
                  />
                  <Button variant="destructive" size="sm" onClick={() => {
                    const updatedMethods = paymentMethods.filter(p => p.id !== payment.id);
                    setPaymentMethods(updatedMethods);
                  }}>X</Button>
                </div>
              ))}

              {remainingAmount > 0 && (
                <Button onClick={handleAddPaymentMethod} variant="outline" className="w-full">
                  Agregar Medio de Pago
                </Button>
              )}

              <div className="text-center">
                <p className={`text-lg font-semibold ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {change >= 0 ? 'Cambio' : 'Restante'}
                </p>
                <p className={`text-2xl font-bold ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatPrice(Math.abs(change))}
                </p>
              </div>
            </div>
          )}

          {paymentState === 'completed' && (
            <div className="text-center py-8 space-y-4">
                <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
                <h2 className="text-2xl font-bold">¡Pago registrado con éxito!</h2>
                <p className="text-muted-foreground">La venta ha sido generada y el inventario actualizado.</p>
            </div>
          )}

          <DialogFooter>
            {paymentState === 'paying' && (
              <>
                <Button onClick={handleCloseDialog} variant="outline">Cancelar</Button>
                <Button onClick={handlePay} disabled={change < 0 || paymentMutation.isPending}>
                  {paymentMutation.isPending ? 'Procesando...' : 'Pagar'}
                </Button>
              </>
            )}
            {paymentState === 'completed' && (
              <>
                <Button onClick={handleCloseDialog} variant="outline">Finalizar</Button>
                <Button onClick={() => setIsReceiptDialogOpen(true)} disabled={!completedSaleId}>
                  {isSaleDataLoading ? 'Cargando...' : 'Ver Recibo'}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {paymentState === 'uploading_evidence' && currentEvidencePayment && (
        <PaymentEvidenceUploadDialog
          isOpen={true}
          onOpenChange={() => setPaymentState('completed')}
          attentionPaymentId={currentEvidencePayment.id}
          branchId={attention.branch_id}
          onUploadComplete={handleUploadComplete}
        />
      )}

      <ReceiptDialog 
        isOpen={isReceiptDialogOpen} 
        onClose={() => setIsReceiptDialogOpen(false)} 
        saleData={saleData}
      />
    </>
  );
};

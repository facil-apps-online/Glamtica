import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { usePriceFormat } from '@/hooks/usePriceFormat';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SaleDetails } from '@/hooks/useSaleDetails';
import { Badge } from '@/components/ui/badge';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { useAuth } from '@/contexts/AuthContext';

interface TransactionReceiptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  saleData: SaleDetails | null;
}

const ReceiptContent = ({ saleData }: { saleData: SaleDetails }) => {
  const { formatPrice } = usePriceFormat();
  const { tenantId } = useAuth();
  const { data: availablePaymentMethods } = usePaymentMethods(tenantId);

  const parentItems = saleData.items?.filter(item => !item.parent_item_id) || [];
  const childItemsByParent = saleData.items?.reduce((acc, item) => {
    if (item.parent_item_id) {
      if (!acc[item.parent_item_id]) {
        acc[item.parent_item_id] = [];
      }
      acc[item.parent_item_id].push(item);
    }
    return acc;
  }, {} as Record<string, typeof saleData.items>) || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <h3 className="font-semibold">Cliente</h3>
          <p>{saleData.client.name}</p>
          {saleData.client.identification_number && <p>ID: {saleData.client.identification_number}</p>}
          {saleData.client.address && <p>{saleData.client.address}</p>}
          {saleData.client.phone && <p>Tel: {saleData.client.phone}</p>}
        </div>
        <div className="text-right">
          <h3 className="font-semibold">{saleData.branch.name}</h3>
          <p>Recibo #: {saleData.sale_number}</p>
          <p>Fecha: {new Date(saleData.sale_date).toLocaleString()}</p>
        </div>
      </div>

      {/* Items Table */}
      <div>
        <h4 className="font-semibold mb-2">Detalle de la Venta</h4>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descripción</TableHead>
              <TableHead className="text-center">Cantidad</TableHead>
              <TableHead className="text-right">Precio Unit.</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {parentItems.length === 0 && (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No hay productos o servicios en esta venta.</TableCell></TableRow>
            )}
            {parentItems.map(item => (
              <React.Fragment key={item.id}>
                <TableRow className={item.item_type === 'COMBO' ? 'bg-muted/50' : ''}>
                  <TableCell className={`font-medium ${item.item_type === 'COMBO' ? 'pl-4' : ''}`}>{item.description}</TableCell>
                  <TableCell className="text-center">{item.quantity}</TableCell>
                  <TableCell className="text-right">{formatPrice(item.unit_price)}</TableCell>
                  <TableCell className="text-right font-semibold">{formatPrice(item.total_price)}</TableCell>
                </TableRow>
                {childItemsByParent[item.id]?.map(child => (
                  <TableRow key={child.id}>
                    <TableCell className="pl-8 text-muted-foreground">{child.description}</TableCell>
                    <TableCell className="text-center text-muted-foreground">{child.quantity}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{formatPrice(child.unit_price)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{formatPrice(child.total_price)}</TableCell>
                  </TableRow>
                ))}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Totals */}
      <div className="flex justify-end">
        <div className="w-64 text-sm space-y-1">
          <div className="flex justify-between"><span>Subtotal:</span><span>{formatPrice(saleData.subtotal_amount)}</span></div>
          <div className="flex justify-between"><span>Impuestos:</span><span>{formatPrice(saleData.total_tax_amount)}</span></div>
          <div className="flex justify-between font-bold text-base mt-1 pt-1 border-t"><span>Total:</span><span>{formatPrice(saleData.total_amount)}</span></div>
        </div>
      </div>

      {/* Payments Section */}
      <div>
        <h4 className="font-semibold mb-2">Pagos Realizados</h4>
        <div className="space-y-2">
          {saleData.payments && saleData.payments.length > 0 ? (
            saleData.payments.map(payment => {
              const method = availablePaymentMethods?.find(m => m.id === payment.payment_method_id);
              return (
                <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                  <div>
                    <p className="font-semibold">{method?.name || 'Método desconocido'}</p>
                    <Badge variant={payment.status === 'completed' ? 'success' : 'secondary'}>{payment.status}</Badge>
                  </div>
                  <p className="text-lg font-bold">{formatPrice(payment.amount)}</p>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No se registraron pagos para esta atención.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export const TransactionReceiptDialog: React.FC<TransactionReceiptDialogProps> = ({ isOpen, onClose, saleData }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Recibo de Transacción</DialogTitle>
        </DialogHeader>
        {saleData ? (
          <ReceiptContent saleData={saleData} />
        ) : (
          <div className="text-center py-8">Cargando datos del recibo...</div>
        )}
        <DialogFooter>
          <Button onClick={onClose} variant="outline">Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

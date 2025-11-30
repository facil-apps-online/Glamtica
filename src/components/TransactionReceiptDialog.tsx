import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { usePriceFormat } from '@/hooks/usePriceFormat';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SaleDetails } from '@/hooks/useSaleDetails';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { useAuth } from '@/contexts/AuthContext';
import { useScreenSize } from '@/hooks/useScreenSize';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TransactionReceiptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  saleData: SaleDetails | null;
}

// --- Mobile-First Components ---

const MobileReceiptContent = ({ saleData }: { saleData: SaleDetails }) => {
  const { formatPrice } = usePriceFormat();
  const { tenantId } = useAuth();
  const { data: availablePaymentMethods } = usePaymentMethods(tenantId);

  const parentItems = saleData.items?.filter(item => !item.parent_item_id) || [];
  const childItemsByParent = saleData.items?.reduce((acc, item) => {
    if (item.parent_item_id) {
      if (!acc[item.parent_item_id]) { acc[item.parent_item_id] = []; }
      acc[item.parent_item_id].push(item);
    }
    return acc;
  }, {} as Record<string, typeof saleData.items>) || {};

  return (
    <div className="space-y-4 text-sm">
      {/* Header */}
      <div className="text-center">
        <h2 className="font-bold text-xl">{saleData.tenant?.name}</h2>
        <h3 className="font-semibold text-lg">{saleData.branch.name}</h3>
        <p className="text-xs text-muted-foreground">Recibo #: {saleData.sale_number}</p>
        <p className="text-xs text-muted-foreground">{new Date(saleData.sale_date).toLocaleString()}</p>
      </div>

      {/* Client */}
      <div className="border-t pt-3">
        <h4 className="font-semibold mb-1">Cliente</h4>
        <p>{saleData.client.name}</p>
        {saleData.client.identification_number && <p className="text-xs text-muted-foreground">ID: {saleData.client.identification_number}</p>}
        {saleData.client.phone && <p className="text-xs text-muted-foreground">Tel: {saleData.client.phone}</p>}
      </div>

      {/* Items */}
      <div className="border-t pt-3">
        <h4 className="font-semibold mb-2">Detalle de la Venta</h4>
        <div className="space-y-2">
          {parentItems.length === 0 && <p className="text-center text-muted-foreground py-4">No hay ítems.</p>}
          {parentItems.map(item => (
            <div key={item.id} className={`border-b pb-2 ${item.item_type === 'COMBO' ? 'bg-muted/50 p-2 rounded-lg' : ''}`}>
              <div className="font-medium">{item.description}</div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">{item.quantity} x {formatPrice(item.unit_price)}</span>
                <span className="font-semibold">{formatPrice(item.total_price)}</span>
              </div>
              {childItemsByParent[item.id]?.map(child => (
                <div key={child.id} className="pl-4 mt-1">
                  <div className="text-muted-foreground text-xs">{child.description}</div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">{child.quantity} x {formatPrice(child.unit_price)}</span>
                    <span>{formatPrice(child.total_price)}</span>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Payments */}
      <div className="border-t pt-3">
        <h4 className="font-semibold mb-2">Pagos Realizados</h4>
        <div className="space-y-2">
          {saleData.payments && saleData.payments.length > 0 ? (
            saleData.payments.map(payment => {
              const method = availablePaymentMethods?.find(m => m.id === payment.payment_method_id);
              return (
                <div key={payment.id} className="flex items-center justify-between rounded-lg">
                  <p className="font-semibold">{method?.name || 'Método desconocido'}</p>
                  <p className="font-semibold">{formatPrice(payment.amount)}</p>
                </div>
              );
            })
          ) : (
            <p className="text-xs text-muted-foreground text-center py-2">No se registraron pagos.</p>
          )}
        </div>
      </div>

      {/* Totals */}
      <div className="border-t pt-3 space-y-1">
        <div className="flex justify-between"><span>Subtotal:</span><span>{formatPrice(saleData.subtotal_amount)}</span></div>
        <div className="flex justify-between"><span>Impuestos:</span><span>{formatPrice(saleData.total_tax_amount)}</span></div>
        <div className="flex justify-between font-bold text-base mt-1 pt-1 border-t"><span>Total:</span><span>{formatPrice(saleData.total_amount)}</span></div>
      </div>
    </div>
  );
};

const DesktopReceiptContent = ({ saleData }: { saleData: SaleDetails }) => {
  const { formatPrice } = usePriceFormat();
  const { tenantId } = useAuth();
  const { data: availablePaymentMethods } = usePaymentMethods(tenantId);

  const parentItems = saleData.items?.filter(item => !item.parent_item_id) || [];
  const childItemsByParent = saleData.items?.reduce((acc, item) => {
    if (item.parent_item_id) {
      if (!acc[item.parent_item_id]) { acc[item.parent_item_id] = []; }
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
          <h2 className="font-bold text-xl">{saleData.tenant?.name}</h2>
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
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No hay ítems en esta venta.</TableCell></TableRow>
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

      {/* Payments and Totals */}
      <div className="flex justify-between items-start">
        <div>
            <h4 className="font-semibold mb-2">Pagos Realizados</h4>
            <div className="space-y-2 text-sm">
            {saleData.payments && saleData.payments.length > 0 ? (
                saleData.payments.map(payment => {
                const method = availablePaymentMethods?.find(m => m.id === payment.payment_method_id);
                return (
                    <div key={payment.id} className="flex items-center justify-between gap-4">
                        <p className="font-medium">{method?.name || 'Método desconocido'}</p>
                        <p>{formatPrice(payment.amount)}</p>
                    </div>
                );
                })
            ) : (
                <p className="text-sm text-muted-foreground">No se registraron pagos.</p>
            )}
            </div>
        </div>
        <div className="w-64 text-sm space-y-1">
          <div className="flex justify-between"><span>Subtotal:</span><span>{formatPrice(saleData.subtotal_amount)}</span></div>
          <div className="flex justify-between"><span>Impuestos:</span><span>{formatPrice(saleData.total_tax_amount)}</span></div>
          <div className="flex justify-between font-bold text-base mt-1 pt-1 border-t"><span>Total:</span><span>{formatPrice(saleData.total_amount)}</span></div>
        </div>
      </div>
    </div>
  );
};

export const TransactionReceiptDialog: React.FC<TransactionReceiptDialogProps> = ({ isOpen, onClose, saleData }) => {
  const screenSize = useScreenSize();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95%] sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Recibo de Transacción</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] p-4">
          {saleData ? (
            screenSize === 'sm' || screenSize === 'md' ? <MobileReceiptContent saleData={saleData} /> : <DesktopReceiptContent saleData={saleData} />
          ) : (
            <div className="text-center py-8">Cargando datos del recibo...</div>
          )}
        </ScrollArea>
        <DialogFooter>
          <Button onClick={onClose} variant="outline">Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

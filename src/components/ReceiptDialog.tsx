import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { usePriceFormat } from '@/hooks/usePriceFormat';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useSaleDetails, SaleDetails } from '@/hooks/useSaleDetails'; // Import new hook and type
import { Skeleton } from '@/components/ui/skeleton';

interface ReceiptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  saleId: string | null; // Changed prop
}

// A new component to render the receipt content
const ReceiptContent = ({ saleData }: { saleData: SaleDetails }) => {
  const { formatPrice } = usePriceFormat();

  // Logic to process items for hierarchical display
  const parentItems = saleData.items.filter(item => !item.parent_item_id);
  const childItemsByParent = saleData.items.reduce((acc, item) => {
    if (item.parent_item_id) {
      if (!acc[item.parent_item_id]) {
        acc[item.parent_item_id] = [];
      }
      acc[item.parent_item_id].push(item);
    }
    return acc;
  }, {} as Record<string, typeof saleData.items>);

  return (
    <div className="space-y-4">
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

      <div>
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
            {parentItems.map(item => (
              <React.Fragment key={item.id}>
                <TableRow className={item.item_type === 'COMBO' ? 'bg-muted/50' : ''}>
                  <TableCell className={`font-medium ${item.item_type === 'COMBO' ? 'pl-4' : ''}`}>
                    {item.description}
                  </TableCell>
                  <TableCell className="text-center">{item.quantity}</TableCell>
                  <TableCell className="text-right">{formatPrice(item.unit_price)}</TableCell>
                  <TableCell className="text-right font-semibold">{formatPrice(item.total_price)}</TableCell>
                </TableRow>
                {/* Render child items if they exist for this parent */}
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

      <div className="flex justify-end">
        <div className="w-64 text-sm">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{formatPrice(saleData.subtotal_amount)}</span>
          </div>
          <div className="flex justify-between">
            <span>Impuestos:</span>
            <span>{formatPrice(saleData.total_tax_amount)}</span>
          </div>
          <div className="flex justify-between font-bold text-base mt-1 pt-1 border-t">
            <span>Total:</span>
            <span>{formatPrice(saleData.total_amount)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};


export const ReceiptDialog: React.FC<ReceiptDialogProps> = ({ isOpen, onClose, saleId }) => {
  const { data: saleData, isLoading, error } = useSaleDetails(saleId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Recibo de Venta</DialogTitle>
        </DialogHeader>
        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        )}
        {error && <p className="text-red-500">Error al cargar el recibo: {error.message}</p>}
        {saleData && <ReceiptContent saleData={saleData} />}
        <DialogFooter>
          {/* Placeholder for future e-invoicing button */}
          {/* {saleData?.eInvoicingConfig.enabled && ... } */}
          <Button onClick={onClose} variant="outline">Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePurchaseReceptionDetails } from "@/hooks/usePurchaseReceptionDetails";
import { useAdjustPurchaseTotal } from "@/hooks/useAdjustPurchaseTotal";
import { useUpdatePurchasePaymentStatus } from "@/hooks/useUpdatePurchasePaymentStatus";
import { usePriceFormat } from "@/hooks/usePriceFormat";
import { Loader2 } from "lucide-react";

interface ViewPurchaseReceptionDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  purchase: any; // Debería ser un tipo más específico
}

export function ViewPurchaseReceptionDetailsDialog({ isOpen, onOpenChange, purchase }: ViewPurchaseReceptionDetailsDialogProps) {
  const { data: receptionDetails, isLoading, error } = usePurchaseReceptionDetails(purchase.id);
  const adjustTotalMutation = useAdjustPurchaseTotal();
  const updatePaymentStatusMutation = useUpdatePurchasePaymentStatus();
  const { formatPrice } = usePriceFormat();

  const adjustedTotal = receptionDetails?.reduce((acc, item) => acc + (item.quantity_received * item.cost_price), 0) ?? 0;

  const handlePayOriginal = () => {
    updatePaymentStatusMutation.mutate({ purchase_id: purchase.id, payment_status: 'pagado' }, {
      onSuccess: () => onOpenChange(false)
    });
  };

  const handleAdjustAndPay = () => {
    adjustTotalMutation.mutate({ purchase_id: purchase.id }, {
      onSuccess: () => {
        updatePaymentStatusMutation.mutate({ purchase_id: purchase.id, payment_status: 'pagado' }, {
          onSuccess: () => onOpenChange(false)
        });
      }
    });
  };

  if (isLoading) return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}><DialogContent className="sm:max-w-2xl"><Loader2 className="h-8 w-8 animate-spin mx-auto my-8" /></DialogContent></Dialog>
  );

  if (error) return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}><DialogContent className="sm:max-w-2xl"><p className="text-red-500 text-center">Error al cargar detalles de recepción: {error.message}</p></DialogContent></Dialog>
  );

  const showPaymentOptions = purchase.status === 'completada_con_incidencias' && purchase.payment_status !== 'pagado';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detalles de Recepción de Compra #{purchase.id.substring(0, 8)}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead className="text-center">Cant. Esperada</TableHead>
                <TableHead className="text-center">Cant. Recibida</TableHead>
                <TableHead className="text-center font-bold">Diferencia</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {receptionDetails && receptionDetails.length > 0 ? (
                receptionDetails.map((item) => (
                  <TableRow key={item.purchase_item_id}>
                    <TableCell>{item.product_name}</TableCell>
                    <TableCell className="text-center">{item.quantity_expected}</TableCell>
                    <TableCell className="text-center">{item.quantity_received}</TableCell>
                    <TableCell className={`text-center font-bold ${item.quantity_received - item.quantity_expected !== 0 ? 'text-orange-500' : ''}`}>
                      {item.quantity_received - item.quantity_expected}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No hay detalles de recepción para esta compra.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          
          {showPaymentOptions && receptionDetails && receptionDetails.length > 0 && (
            <div className="p-4 border-t space-y-2">
              <h4 className="font-semibold mb-2 text-center">Opciones de Pago</h4>
              <div className="flex justify-between items-center bg-gray-50 p-2 rounded-md">
                <span className="text-muted-foreground">Monto Original:</span>
                <span className="font-bold">{formatPrice(purchase.total_amount)}</span>
              </div>
              <div className="flex justify-between items-center bg-green-50 p-2 rounded-md">
                <span className="text-muted-foreground">Monto Ajustado (según recibido):</span>
                <span className="font-bold text-lg text-green-600">{formatPrice(adjustedTotal)}</span>
              </div>
            </div>
          )}

          {purchase.reception_notes && (
            <div className="pt-4 border-t">
              <h4 className="font-semibold">Notas de Recepción:</h4>
              <p className="text-sm text-muted-foreground italic">"{purchase.reception_notes}"</p>
            </div>
          )}
        </div>
        <DialogFooter className="sm:justify-between">
          {showPaymentOptions ? (
            <>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <div className="flex gap-2">
                <Button 
                  variant="secondary" 
                  onClick={handlePayOriginal}
                  disabled={updatePaymentStatusMutation.isPending || adjustTotalMutation.isPending}
                >
                  Pagar Total Original
                </Button>
                <Button 
                  onClick={handleAdjustAndPay}
                  disabled={updatePaymentStatusMutation.isPending || adjustTotalMutation.isPending}
                >
                  {(updatePaymentStatusMutation.isPending || adjustTotalMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Ajustar y Pagar Recibido
                </Button>
              </div>
            </>
          ) : (
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

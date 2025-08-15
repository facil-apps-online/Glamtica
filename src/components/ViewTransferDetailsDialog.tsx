import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTransferDetails } from "@/hooks/useTransferDetails";
import { Loader2 } from "lucide-react";

interface ViewTransferDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  transfer: any;
}

export function ViewTransferDetailsDialog({ isOpen, onOpenChange, transfer }: ViewTransferDetailsDialogProps) {
  const { data: transferDetails, isLoading, error } = useTransferDetails(transfer.id);

  if (isLoading) return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}><DialogContent className="sm:max-w-2xl"><Loader2 className="h-8 w-8 animate-spin mx-auto my-8" /></DialogContent></Dialog>
  );

  if (error) return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}><DialogContent className="sm:max-w-2xl"><p className="text-red-500 text-center">Error al cargar detalles del traslado: {error.message}</p></DialogContent></Dialog>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detalles de Traslado #{transfer.id.substring(0, 8)}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead className="text-center">Cantidad</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transferDetails && transferDetails.length > 0 ? (
                transferDetails.map((item) => (
                  <TableRow key={item.item_id}>
                    <TableCell>{item.product_name}</TableCell>
                    <TableCell className="text-center">{item.quantity}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={2} className="h-24 text-center">
                    No hay items en este traslado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
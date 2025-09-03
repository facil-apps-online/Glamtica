import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useReceiveProductTransfer } from "@/hooks/useReceiveProductTransfer";
import { useTransferDetails } from "@/hooks/useTransferDetails";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

const receiveItemSchema = z.object({
  transfer_item_id: z.string(),
  product_id: z.string(),
  product_name: z.string(),
  quantity_expected: z.number(),
  quantity_received: z.coerce.number().min(0, "La cantidad no puede ser negativa"),
});

const receiveTransferSchema = z.object({
  reception_notes: z.string().optional(),
  items: z.array(receiveItemSchema),
});

type ReceiveTransferFormValues = z.infer<typeof receiveTransferSchema>;

interface ReceiveTransferDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  transfer: any;
}

export function ReceiveTransferDialog({ isOpen, onOpenChange, transfer }: ReceiveTransferDialogProps) {
  const receiveTransferMutation = useReceiveProductTransfer();
  const { data: transferDetails, isLoading, error } = useTransferDetails(transfer?.id);

  const form = useForm<ReceiveTransferFormValues>({
    resolver: zodResolver(receiveTransferSchema),
  });

  useEffect(() => {
    if (transferDetails) {
      form.reset({
        reception_notes: "",
        items: transferDetails.map((item: any) => ({
          transfer_item_id: item.item_id,
          product_id: item.product_id,
          product_name: item.product_name || "Producto desconocido",
          quantity_expected: item.quantity,
          quantity_received: item.quantity,
        })),
      });
    }
  }, [transferDetails, form]);

  const { fields } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const onSubmit = (values: ReceiveTransferFormValues) => {
    receiveTransferMutation.mutate({
      transfer_id: transfer.id,
      reception_notes: values.reception_notes,
      received_items: values.items.map(item => ({
        transfer_item_id: item.transfer_item_id,
        quantity_received: item.quantity_received,
      })),
    }, {
      onSuccess: () => onOpenChange(false),
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Recibir Traslado #{transfer?.id.substring(0, 8)}</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : error ? (
          <div className="text-red-500 text-center p-8">
            Error al cargar los detalles del traslado: {error.message}
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-4 p-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-center">Cant. Esperada</TableHead>
                    <TableHead className="text-center">Cant. Recibida</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field, index) => {
                    // Encontrar los detalles completos del item actual para obtener allow_decimal_sale
                    const itemDetails = transferDetails?.find((d: any) => d.item_id === field.transfer_item_id);
                    const isDecimalAllowed = itemDetails?.allow_decimal_sale || false;

                    return (
                      <TableRow key={field.id}>
                        <TableCell>{field.product_name}</TableCell>
                        <TableCell className="text-center">{field.quantity_expected}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            className="w-24 mx-auto text-center"
                            min={isDecimalAllowed ? 0 : 0} // Permitir 0 para indicar no recibido
                            step={isDecimalAllowed ? "0.01" : "1"}
                            {...form.register(`items.${index}.quantity_received`, {
                              onChange: (e) => {
                                if (!isDecimalAllowed) {
                                  e.target.value = parseInt(e.target.value, 10) || '';
                                }
                              }
                            })}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <div>
                <Label htmlFor="reception_notes">Notas de Recepción (Opcional)</Label>
                <Textarea
                  id="reception_notes"
                  {...form.register("reception_notes")}
                  placeholder="Ej: La caja del producto X estaba dañada..."
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancelar</Button>
              </DialogClose>
              <Button type="submit" disabled={receiveTransferMutation.isPending}>
                {receiveTransferMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmar Recepción
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
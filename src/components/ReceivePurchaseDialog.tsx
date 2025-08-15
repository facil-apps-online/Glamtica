import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useReceivePurchase } from "@/hooks/useReceivePurchase";
import { Loader2 } from "lucide-react";

const receiveItemSchema = z.object({
  purchase_item_id: z.string(),
  product_id: z.string(),
  product_name: z.string(),
  quantity_expected: z.number(),
  quantity_received: z.coerce.number().int().min(0, "La cantidad no puede ser negativa"),
});

const receivePurchaseSchema = z.object({
  reception_notes: z.string().optional(),
  items: z.array(receiveItemSchema),
});

type ReceivePurchaseFormValues = z.infer<typeof receivePurchaseSchema>;

interface ReceivePurchaseDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  purchase: any; // Debería ser un tipo más específico
}

export function ReceivePurchaseDialog({ isOpen, onOpenChange, purchase }: ReceivePurchaseDialogProps) {
  const receivePurchaseMutation = useReceivePurchase();

  const form = useForm<ReceivePurchaseFormValues>({
    resolver: zodResolver(receivePurchaseSchema),
    defaultValues: {
      reception_notes: "",
      items: purchase.items.map((item: any) => ({
        purchase_item_id: item.id,
        product_id: item.product_id,
        product_name: item.product?.name || "Producto desconocido",
        quantity_expected: item.quantity,
        quantity_received: item.quantity, // Por defecto, se recibe lo esperado
      })),
    },
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const onSubmit = (values: ReceivePurchaseFormValues) => {
    receivePurchaseMutation.mutate({
      purchase_id: purchase.id,
      branch_id: purchase.branch_id,
      reception_notes: values.reception_notes,
      received_items: values.items.map(item => ({
        purchase_item_id: item.purchase_item_id,
        product_id: item.product_id,
        quantity_expected: item.quantity_expected,
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
          <DialogTitle>Recibir Compra #{purchase.id.substring(0, 8)}</DialogTitle>
        </DialogHeader>
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
                {fields.map((field, index) => (
                  <TableRow key={field.id}>
                    <TableCell>{field.product_name}</TableCell>
                    <TableCell className="text-center">{field.quantity_expected}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        className="w-24 mx-auto text-center"
                        {...form.register(`items.${index}.quantity_received`)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
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
            <Button type="submit" disabled={receivePurchaseMutation.isPending}>
              {receivePurchaseMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar Recepción
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

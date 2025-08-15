import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApproveProductTransfer } from "@/hooks/useApproveProductTransfer";
import { useRejectProductTransfer } from "@/hooks/useRejectProductTransfer";
import { Loader2 } from "lucide-react";

const adjustedItemSchema = z.object({
  item_id: z.string().uuid(),
  quantity: z.coerce.number().int().min(0, "La cantidad no puede ser negativa."),
});

const approveTransferFormSchema = z.object({
  adjusted_items: z.array(adjustedItemSchema),
});

type ApproveTransferFormValues = z.infer<typeof approveTransferFormSchema>;

interface ApproveTransferDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  transfer: any; // The transfer to be approved/rejected
}

export function ApproveTransferDialog({ isOpen, onOpenChange, transfer }: ApproveTransferDialogProps) {
  const approveMutation = useApproveProductTransfer();
  const rejectMutation = useRejectProductTransfer();

  const form = useForm<ApproveTransferFormValues>({
    resolver: zodResolver(approveTransferFormSchema),
  });

  useEffect(() => {
    if (transfer) {
      form.reset({ 
        adjusted_items: transfer.items.map((item: any) => ({ 
          item_id: item.id, 
          quantity: item.quantity 
        })) 
      });
    }
  }, [transfer, form]);

  const onSubmit = (values: ApproveTransferFormValues) => {
    approveMutation.mutate({ transfer_id: transfer.id, adjusted_items: values.adjusted_items }, {
      onSuccess: () => onOpenChange(false),
    });
  };

  const handleReject = () => {
    rejectMutation.mutate({ transfer_id: transfer.id }, {
      onSuccess: () => onOpenChange(false),
    });
  };

  const isLoading = approveMutation.isPending || rejectMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Aprobar/Rechazar Traslado</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <h3 className="font-semibold">Items Solicitados</h3>
            <div className="space-y-2 mt-2">
              {transfer?.items.map((item: any, index: number) => (
                <div key={item.id} className="grid grid-cols-3 gap-4 items-center">
                  <Label>{item.product.name}</Label>
                  <Input 
                    type="number" 
                    defaultValue={item.quantity}
                    {...form.register(`adjusted_items.${index}.quantity`)}
                  />
                  <input type="hidden" {...form.register(`adjusted_items.${index}.item_id`)} value={item.id} />
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="destructive" onClick={handleReject} disabled={isLoading}>
              {rejectMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Rechazar"}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {approveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aprobar con Ajustes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

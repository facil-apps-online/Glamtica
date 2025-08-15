import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useBranches } from "@/hooks/useBranches";
import { useBranchProducts } from "@/hooks/useProducts";
import { useCreateProductTransferRequest } from "@/hooks/useCreateProductTransferRequest"; // Assuming this hook
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Plus, Trash2 } from "lucide-react";

const transferItemSchema = z.object({
  product_id: z.string().uuid({ message: "ID de producto inválido." }),
  quantity: z.coerce.number().int().positive({ message: "La cantidad debe ser un número entero positivo." }),
});

const transferRequestFormSchema = z.object({
  requesting_branch_id: z.string().uuid({ message: "ID de sucursal solicitante inválido." }),
  origin_branch_id: z.string().uuid({ message: "ID de sucursal de origen inválido." }),
  notes: z.string().optional().nullable(),
  items: z.array(transferItemSchema).min(1, { message: "Debe agregar al menos un producto." }),
});

type TransferRequestFormValues = z.infer<typeof transferRequestFormSchema>;

export function ProductTransferRequestDialog({ trigger }: { trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;

  const { data: branches, isLoading: isLoadingBranches } = useBranches(tenantId);
  const createTransferRequestMutation = useCreateProductTransferRequest();

  const form = useForm<TransferRequestFormValues>({
    resolver: zodResolver(transferRequestFormSchema),
    defaultValues: {
      items: [{ product_id: "", quantity: 1 }],
    },
  });

  const originBranchId = form.watch("origin_branch_id");
  const { data: products, isLoading: isLoadingProducts } = useBranchProducts(originBranchId);

  const onSubmit = async (values: TransferRequestFormValues) => {
    createTransferRequestMutation.mutate(values, {
      onSuccess: () => {
        form.reset();
        setOpen(false);
      },
    });
  };

  const isLoading = isLoadingBranches || isLoadingProducts || createTransferRequestMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-primary">Nueva Solicitud de Traslado</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            {/* Requesting Branch */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="requesting_branch_id" className="text-right">Sucursal Solicitante</Label>
              <Select onValueChange={(value) => form.setValue("requesting_branch_id", value)} value={form.watch("requesting_branch_id")}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecciona una sucursal" />
                </SelectTrigger>
                <SelectContent>
                  {branches?.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Origin Branch */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="origin_branch_id" className="text-right">Sucursal de Origen</Label>
              <Select onValueChange={(value) => form.setValue("origin_branch_id", value)} value={form.watch("origin_branch_id")}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecciona una sucursal" />
                </SelectTrigger>
                <SelectContent>
                  {branches?.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">Notas (Opcional)</Label>
              <Textarea id="notes" className="col-span-3" {...form.register("notes")} placeholder="Notas adicionales..." />
            </div>

            {/* Items Section */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label>Productos</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => form.setValue("items", [...form.getValues("items"), { product_id: "", quantity: 1 }])}>
                  <Plus className="w-4 h-4 mr-1" />
                  Añadir Producto
                </Button>
              </div>
              <div className="p-4 border rounded-md space-y-4">
                {form.watch("items").map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-8">
                      <Label className="text-xs">Producto</Label>
                      <Select value={item.product_id} onValueChange={(value) => form.setValue(`items.${index}.product_id`, value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar producto" />
                        </SelectTrigger>
                        <SelectContent>
                          {products?.map((product) => (
                            <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-3">
                      <Label className="text-xs">Cantidad</Label>
                      <Input type="number" min="1" className="w-full" {...form.register(`items.${index}.quantity`, { valueAsNumber: true })} />
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => form.setValue("items", form.getValues("items").filter((_, i) => i !== index))} disabled={form.watch("items").length === 1} className="col-span-1 h-10">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={isLoading}>{isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Enviar Solicitud</Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

import { useState, useEffect } from "react";
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
import { useCreateProductTransfer } from "@/hooks/useCreateProductTransfer";
import { useBranchProducts } from "@/hooks/useProducts";
import { Loader2, Plus, Trash2 } from "lucide-react";

const transferItemSchema = z.object({
  product_id: z.string().uuid({ message: "ID de producto inválido." }),
  quantity: z.coerce.number().positive({ message: "La cantidad debe ser un número positivo." }),
});

const transferFormSchema = z.object({
  from_branch_id: z.string().uuid({ message: "ID de sucursal de origen inválido." }),
  to_branch_id: z.string().uuid({ message: "ID de sucursal de destino inválido." }),
  transfer_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Formato de fecha inválido (YYYY-MM-DD)." }),
  notes: z.string().optional().nullable(),
  items: z.array(transferItemSchema).min(1, { message: "Debe agregar al menos un producto." }),
});

type TransferFormValues = z.infer<typeof transferFormSchema>;

export function ProductTransferDialog({ trigger }: { trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const { data: branches, isLoading: isLoadingBranches } = useBranches();
  const createTransferMutation = useCreateProductTransfer();

  const form = useForm<TransferFormValues>({
    resolver: zodResolver(transferFormSchema),
    defaultValues: {
      transfer_date: new Date().toISOString().split('T')[0],
      items: [{ product_id: "", quantity: 1 }],
    },
  });

  const fromBranchId = form.watch("from_branch_id");
  const { data: products, isLoading: isLoadingProducts } = useBranchProducts(fromBranchId);

  const onSubmit = async (values: TransferFormValues) => {
    createTransferMutation.mutate(values, {
      onSuccess: () => {
        form.reset();
        setOpen(false);
      },
    });
  };

  const isLoading = isLoadingBranches || isLoadingProducts || createTransferMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-primary">Nuevo Traslado de Productos</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="from_branch_id">Desde Sucursal</Label>
                <Select onValueChange={(value) => form.setValue("from_branch_id", value)} value={form.watch("from_branch_id")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona sucursal de origen" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches?.map((branch) => (
                      <SelectItem key={`from-${branch.id}`} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="to_branch_id">Hacia Sucursal</Label>
                <Select onValueChange={(value) => form.setValue("to_branch_id", value)} value={form.watch("to_branch_id")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona sucursal de destino" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches?.filter(b => b.id !== fromBranchId).map((branch) => (
                      <SelectItem key={`to-${branch.id}`} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="transfer_date">Fecha de Traslado</Label>
              <Input id="transfer_date" type="date" {...form.register("transfer_date")} />
            </div>

            <div>
              <Label htmlFor="notes">Notas (Opcional)</Label>
              <Textarea id="notes" {...form.register("notes")} placeholder="Notas adicionales..." />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <Label>Productos</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => form.setValue("items", [...form.getValues("items"), { product_id: "", quantity: 1 }])}>
                  <Plus className="w-4 h-4 mr-1" />
                  Añadir Producto
                </Button>
              </div>
              <div className="p-4 border rounded-md space-y-4">
                {form.watch("items").map((item, index) => {
                  const selectedProductIds = form.watch("items").map(i => i.product_id);
                  const productsForThisSelect = products?.filter(p => 
                    !selectedProductIds.includes(p.id) || p.id === item.product_id
                  );
                  
                  // Encontrar el producto seleccionado para este item
                  const selectedProduct = products?.find(p => p.id === item.product_id);
                  const isDecimalAllowed = selectedProduct?.allow_decimal_sale || false;

                  return (
                    <div key={index} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-8">
                        <Label className="text-xs">Producto</Label>
                        <Select value={item.product_id} onValueChange={(value) => form.setValue(`items.${index}.product_id`, value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar producto" />
                          </SelectTrigger>
                          <SelectContent>
                            {productsForThisSelect?.map((product) => (
                              <SelectItem key={`product-${product.id}`} value={product.id}>
                                {product.name} (Stock: {product.stock_quantity})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-3">
                        <Label className="text-xs">Cantidad</Label>
                        <Input 
                          type="number" 
                          min={isDecimalAllowed ? "0.01" : "1"}
                          step={isDecimalAllowed ? "0.01" : "1"}
                          className="w-full" 
                          {...form.register(`items.${index}.quantity`, { 
                            valueAsNumber: true,
                            onChange: (e) => {
                              // Forzar entero si no se permiten decimales
                              if (!isDecimalAllowed) {
                                e.target.value = parseInt(e.target.value, 10) || '';
                              }
                            }
                          })} 
                        />
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={() => form.setValue("items", form.getValues("items").filter((_, i) => i !== index))} disabled={form.watch("items").length === 1} className="col-span-1 h-10">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading || createTransferMutation.isPending}>
                {createTransferMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Crear Traslado
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
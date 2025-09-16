import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useSettings } from "@/hooks/useSettings";
import { useBranches } from "@/hooks/useBranches";
import { useActiveSuppliers } from "@/hooks/useSuppliers";
import { useCreatePurchase } from "@/hooks/useCreatePurchase";
import { useAuth } from "@/contexts/AuthContext";
import { usePriceFormat } from "@/hooks/usePriceFormat";
import { useProductsBySupplier } from "@/hooks/useSupplierProducts";
import { SupplierDialog } from "@/components/SupplierDialog";
import { Loader2, Plus, Trash2 } from "lucide-react";

const purchaseItemSchema = z.object({
  product_id: z.string().uuid({ message: "ID de producto inválido." }),
  quantity: z.coerce.number().int().positive({ message: "La cantidad debe ser un número entero positivo." }),
  cost_price: z.coerce.number().positive({ message: "El costo debe ser un número positivo." }),
});

const purchaseFormSchema = z.object({
  branch_id: z.string().uuid({ message: "ID de sucursal inválido." }),
  supplier_id: z.string().uuid({ message: "ID de proveedor inválido." }).optional().nullable(),
  purchase_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Formato de fecha inválido (YYYY-MM-DD)." }),
  invoice_number: z.string().optional().nullable(),
  total_amount: z.coerce.number().min(0, { message: "El monto total no puede ser negativo." }),
  status: z.enum(["draft", "completed", "cancelled"]).default("draft"),
  notes: z.string().optional().nullable(),
  items: z.array(purchaseItemSchema).min(1, { message: "Debe agregar al menos un producto." }),
});

type PurchaseFormValues = z.infer<typeof purchaseFormSchema>;

export function PurchaseDialog({ trigger }: { trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const { currentAssignment, user } = useAuth();
  const tenantId = currentAssignment?.tenant_id;

  const { data: settings, isLoading: isLoadingSettings } = useSettings();
  const { data: branches, isLoading: isLoadingBranches } = useBranches(tenantId);
  const { data: suppliers, isLoading: isLoadingSuppliers } = useActiveSuppliers();
  const createPurchaseMutation = useCreatePurchase();
  const { formatPrice, symbol: displaySymbol } = usePriceFormat();
  const costingMethod = user?.user_metadata?.costing_method || settings?.costing_method || 'average';
  const costingMethodLabel = costingMethod === 'average' ? 'Promedio' : 'Última Compra';

  const form = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseFormSchema),
    defaultValues: {
      purchase_date: new Date().toISOString().split('T')[0], // Format for date input
      status: "draft",
      total_amount: 0,
      items: [{ product_id: "", quantity: 1, cost_price: 0 }],
    },
  });

  const purchaseIndependenceMode = settings?.purchase_independence_mode || "independent"; // Default to independent

  const selectedSupplierId = form.watch("supplier_id");
  const { data: supplierProducts, isLoading: isLoadingSupplierProducts } = useProductsBySupplier(selectedSupplierId || undefined);

  const selectedSupplier = useMemo(() => 
    suppliers?.find(s => s.id === selectedSupplierId),
    [suppliers, selectedSupplierId]
  );

  const availableBranches = useMemo(() => {
    if (!branches) return [];
    if (selectedSupplier && selectedSupplier.branch_ids && selectedSupplier.branch_ids.length > 0) {
      return branches.filter(b => selectedSupplier.branch_ids.includes(b.id));
    }
    return branches; // Si no hay proveedor, mostrar todas
  }, [branches, selectedSupplier]);

  useEffect(() => {
    const currentBranchId = form.getValues("branch_id");
    if (currentBranchId && !availableBranches.some(b => b.id === currentBranchId)) {
      form.setValue("branch_id", ""); // Reset si la sucursal seleccionada ya no es válida
    }
  }, [availableBranches, form]);

  useEffect(() => {
    if (branches && purchaseIndependenceMode === "centralized") {
      const mainBranch = branches.find(b => b.is_main_branch);
      if (mainBranch) {
        form.setValue("branch_id", mainBranch.id);
      }
    }
  }, [branches, purchaseIndependenceMode, form]);

  const onSubmit = async (values: PurchaseFormValues) => {
    // Calculate total_amount before submitting
    const calculatedTotalAmount = values.items.reduce((sum, item) => sum + (item.quantity * item.cost_price), 0);
    const dataToSubmit = { ...values, total_amount: calculatedTotalAmount };

    createPurchaseMutation.mutate(dataToSubmit, {
      onSuccess: () => {
        form.reset();
        setOpen(false);
      },
      onError: (error) => { // Add this block
        console.error("Purchase mutation failed:", error);
        // You might want to add a toast notification here as well
      },
    });
  };

  const isLoading = isLoadingSettings || isLoadingBranches || isLoadingSuppliers || isLoadingSupplierProducts || createPurchaseMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-primary">Nueva Compra</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Método de costeo actual: <span className="font-semibold">{costingMethodLabel}</span>
          </p>
        </DialogHeader>
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            {/* Branch Selection */}
            {(purchaseIndependenceMode === "independent" || purchaseIndependenceMode === "mixed") && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="branch_id" className="text-right">Sucursal</Label>
                <Select
                  onValueChange={(value) => form.setValue("branch_id", value)}
                  value={form.watch("branch_id")}
                  disabled={availableBranches.length === 0}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecciona una sucursal" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableBranches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.branch_id && (
                  <p className="col-span-4 text-right text-red-500 text-sm">{form.formState.errors.branch_id.message}</p>
                )}
              </div>
            )}

            {/* Supplier Selection */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="supplier_id" className="text-right">Proveedor</Label>
              <div className="col-span-3 flex gap-2">
                <Select
                  onValueChange={(value) => form.setValue("supplier_id", value === "none" ? null : value)}
                  value={form.watch("supplier_id") || "none"}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Selecciona un proveedor (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers?.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name} ({supplier.identification_number})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <SupplierDialog />
              </div>
              {form.formState.errors.supplier_id && (
                <p className="col-span-4 text-right text-red-500 text-sm">{form.formState.errors.supplier_id.message}</p>
              )}
            </div>

            {/* Purchase Date */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="purchase_date" className="text-right">Fecha de Compra</Label>
              <Input
                id="purchase_date"
                type="date"
                className="col-span-3"
                {...form.register("purchase_date")}
              />
              {form.formState.errors.purchase_date && (
                <p className="col-span-4 text-right text-red-500 text-sm">{form.formState.errors.purchase_date.message}</p>
              )}
            </div>

            {/* Invoice Number */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="invoice_number" className="text-right">Número de Factura (Opcional)</Label>
              <Input
                id="invoice_number"
                className="col-span-3"
                {...form.register("invoice_number")}
                placeholder="Número de factura"
              />
              {form.formState.errors.invoice_number && (
                <p className="col-span-4 text-right text-red-500 text-sm">{form.formState.errors.invoice_number.message}</p>
              )}
            </div>

            {/* Notes */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">Notas (Opcional)</Label>
              <Textarea
                id="notes"
                className="col-span-3"
                {...form.register("notes")}
                placeholder="Notas adicionales..."
              />
              {form.formState.errors.notes && (
                <p className="col-span-4 text-right text-red-500 text-sm">{form.formState.errors.notes.message}</p>
              )}
            </div>

            {/* Items Section */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label>Productos</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    form.setValue("items", [...form.getValues("items"), { product_id: "", quantity: 1, cost_price: 0 }]);
                  }}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Añadir Producto
                </Button>
              </div>
              
              <div className="p-4 border rounded-md space-y-4">
                {form.watch("items").map((item, index) => {
                  const selectedProductIds = form.watch("items").map(i => i.product_id);
                  const productsForThisSelect = supplierProducts?.filter(sp => 
                    !selectedProductIds.includes(sp.product_id) || sp.product_id === item.product_id
                  );

                  return (
                    <div key={index} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-5">
                        <Label className="text-xs">Producto</Label>
                        <Select 
                          value={item.product_id} 
                          onValueChange={(value) => {
                            form.setValue(`items.${index}.product_id`, value);
                            // Auto-complete price from supplier products if available
                            const selectedProduct = supplierProducts?.find(sp => sp.product_id === value);
                            if (selectedProduct) {
                              form.setValue(`items.${index}.cost_price`, selectedProduct.supplier_price);
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar producto" />
                          </SelectTrigger>
                          <SelectContent>
                            {productsForThisSelect?.map((supplierProduct) => (
                              <SelectItem key={supplierProduct.id} value={supplierProduct.product_id}>
                                {supplierProduct.products?.name} - {formatPrice(supplierProduct.supplier_price)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {form.formState.errors.items?.[index]?.product_id && (
                          <p className="text-red-500 text-xs mt-1">{form.formState.errors.items[index]?.product_id?.message}</p>
                        )}
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">Cantidad</Label>
                        <Input
                          type="number"
                          min="1"
                          className="w-full"
                          {...form.register(`items.${index}.quantity`, { valueAsNumber: true })}
                        />
                        {form.formState.errors.items?.[index]?.quantity && (
                          <p className="text-red-500 text-xs mt-1">{form.formState.errors.items[index]?.quantity?.message}</p>
                        )}
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">Costo Unitario ({displaySymbol})</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          className="w-full"
                          {...form.register(`items.${index}.cost_price`, { valueAsNumber: true })}
                        />
                        {form.formState.errors.items?.[index]?.cost_price && (
                          <p className="text-red-500 text-xs mt-1">{form.formState.errors.items[index]?.cost_price?.message}</p>
                        )}
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">Total</Label>
                        <div className="h-10 px-3 py-2 bg-muted rounded-md text-sm flex items-center">
                          {formatPrice(item.quantity * item.cost_price)}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const currentItems = form.getValues("items");
                          form.setValue("items", currentItems.filter((_, i) => i !== index));
                        }}
                        disabled={form.watch("items").length === 1}
                        className="col-span-1 h-10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  );
                })}
                {form.formState.errors.items && (
                  <p className="text-red-500 text-sm">{form.formState.errors.items.message}</p>
                )}
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Total de la Compra:</span>
                <span className="text-green-600">{formatPrice(form.watch("items").reduce((sum, item) => sum + (item.quantity * item.cost_price), 0))}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading || createPurchaseMutation.isPending}
              >
                {createPurchaseMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Registrar Compra
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
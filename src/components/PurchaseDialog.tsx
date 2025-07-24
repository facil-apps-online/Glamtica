
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, ShoppingCart } from "lucide-react";
import { useCreatePurchase } from "@/hooks/usePurchases";
import { useActiveSuppliers } from "@/hooks/useSuppliers";
import { useProductsBySupplier } from "@/hooks/useSupplierProducts";
import { useSettings } from "@/hooks/useSettings";
import { usePriceFormat } from "@/hooks/usePriceFormat";
import { SupplierDialog } from "@/components/SupplierDialog";

interface PurchaseItem {
  product_id: string;
  quantity: number;
  unit_cost: number;
}

interface PurchaseDialogProps {
  trigger?: React.ReactNode;
}

export const PurchaseDialog = ({ trigger }: PurchaseDialogProps) => {
  const [open, setOpen] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<PurchaseItem[]>([
    { product_id: "", quantity: 1, unit_cost: 0 }
  ]);

  const createMutation = useCreatePurchase();
  const { data: suppliers } = useActiveSuppliers();
  const { data: supplierProducts } = useProductsBySupplier(supplierId);
  const { data: settings } = useSettings();
  const { formatPrice } = usePriceFormat();

  // Obtener símbolo de moneda de configuración
  const currencySymbol = settings?.find(s => s.key === 'currency')?.value || 'EUR';
  const displaySymbol = currencySymbol === 'EUR' ? '€' : 
                       currencySymbol === 'USD' ? '$' : 
                       currencySymbol === 'GBP' ? '£' : currencySymbol;

  const costingMethod = settings?.find(s => s.key === 'costing_method')?.value || 'average';
  const costingMethodLabel = costingMethod === 'average' ? 'Promedio' : 'Última Compra';

  const selectedSupplier = suppliers?.find(s => s.id === supplierId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!supplierId || items.length === 0) {
      return;
    }

    const validItems = items.filter(item => 
      item.product_id && item.quantity > 0 && item.unit_cost >= 0
    );

    if (validItems.length === 0) {
      return;
    }

    try {
      await createMutation.mutateAsync({
        supplier_id: supplierId,
        supplier_name: selectedSupplier?.name || "",
        purchase_date: purchaseDate,
        invoice_number: invoiceNumber || undefined,
        notes: notes || undefined,
        items: validItems,
      });
      setOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving purchase:', error);
    }
  };

  const resetForm = () => {
    setSupplierId("");
    setPurchaseDate(new Date().toISOString().split('T')[0]);
    setInvoiceNumber("");
    setNotes("");
    setItems([{ product_id: "", quantity: 1, unit_cost: 0 }]);
  };

  const addItem = () => {
    setItems([...items, { product_id: "", quantity: 1, unit_cost: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof PurchaseItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Auto-complete price from supplier products if available
    if (field === 'product_id' && value && supplierProducts) {
      const supplierProduct = supplierProducts.find(sp => sp.product_id === value);
      if (supplierProduct) {
        newItems[index].unit_cost = supplierProduct.supplier_price;
      }
    }
    
    setItems(newItems);
  };

  const totalAmount = items.reduce(
    (sum, item) => sum + (item.quantity * item.unit_cost), 
    0
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <ShoppingCart className="w-4 h-4 mr-2" />
            Nueva Compra
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-primary">Nueva Compra</DialogTitle>
          <p className="text-sm text-slate-600">
            Método de costeo actual: <span className="font-semibold">{costingMethodLabel}</span>
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="supplier">Proveedor</Label>
              <div className="flex gap-2">
                <Select value={supplierId} onValueChange={setSupplierId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Selecciona un proveedor" />
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Fecha de Compra</Label>
              <Input
                id="date"
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="invoice">Número de Factura (Opcional)</Label>
            <Input
              id="invoice"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              placeholder="Número de factura"
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Productos</Label>
              <Button type="button" onClick={addItem} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-1" />
                Agregar Producto
              </Button>
            </div>
            
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="flex gap-3 items-end">
                  <div className="flex-1">
                    <Label className="text-xs">Producto</Label>
                    <Select 
                      value={item.product_id} 
                      onValueChange={(value) => updateItem(index, 'product_id', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar producto" />
                      </SelectTrigger>
                      <SelectContent>
                        {supplierProducts?.map((supplierProduct) => (
                          <SelectItem key={supplierProduct.id} value={supplierProduct.product_id}>
                            {supplierProduct.products?.name} - {formatPrice(supplierProduct.supplier_price)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-24">
                    <Label className="text-xs">Cantidad</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div className="w-32">
                    <Label className="text-xs">Costo Unitario ({displaySymbol})</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unit_cost}
                      onChange={(e) => updateItem(index, 'unit_cost', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="w-32">
                    <Label className="text-xs">Total</Label>
                    <div className="h-10 px-3 py-2 bg-slate-50 border rounded-md text-sm">
                      {formatPrice(item.quantity * item.unit_cost)}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeItem(index)}
                    disabled={items.length === 1}
                    className="h-10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {!supplierId && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                Selecciona un proveedor para ver sus productos disponibles
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notas (Opcional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas adicionales..."
            />
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between items-center text-lg font-semibold">
              <span>Total de la Compra:</span>
              <span className="text-green-600">{formatPrice(totalAmount)}</span>
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
              disabled={createMutation.isPending || !supplierId}
            >
              Registrar Compra
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useActiveProducts } from "@/hooks/useProducts";
import { useAddServiceProduct, useUserProductCommission } from "@/hooks/useServiceProducts";
import { ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AddServiceProductDialogProps {
  children: React.ReactNode;
  attentionId: string;
  attentionServiceId: string;
  userId: string;
  userName: string;
}

export const AddServiceProductDialog = ({ 
  children, 
  attentionId, 
  attentionServiceId, 
  userId,
  userName 
}: AddServiceProductDialogProps) => {
  const [open, setOpen] = useState(false);
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);

  const { data: availableProducts } = useActiveProducts();
  const { data: commissionRate } = useUserProductCommission(userId, productId);
  const addProductMutation = useAddServiceProduct();
  const { toast } = useToast();

  const selectedProduct = availableProducts?.find(p => p.id === productId);

  useEffect(() => {
    if (selectedProduct) {
      setUnitPrice(selectedProduct.price);
    }
  }, [selectedProduct]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!productId || quantity <= 0 || unitPrice <= 0) {
      toast({ title: "Error", description: "Por favor, complete todos los campos correctamente.", variant: "destructive" });
      return;
    }

    if (selectedProduct?.stock_quantity !== undefined && selectedProduct.stock_quantity < quantity) {
      toast({ title: "Stock insuficiente", description: `Solo hay ${selectedProduct.stock_quantity} unidades disponibles.`, variant: "destructive" });
      return;
    }

    if (commissionRate === undefined) {
      const confirmSale = window.confirm(`El usuario ${userName} no tiene comisión configurada para este producto. ¿Desea continuar con 0% de comisión?`);
      if (!confirmSale) return;
    }

    try {
      await addProductMutation.mutateAsync({
        attention_id: attentionId,
        attention_service_id: attentionServiceId,
        product_id: productId,
        user_id: userId,
        quantity: quantity,
        unit_price: unitPrice,
        commission_rate: commissionRate || 0,
      });
      
      setOpen(false);
      resetForm();
      
      toast({ title: "Producto agregado", description: `${selectedProduct?.name} agregado al servicio.` });
    } catch (error) {
      console.error('Error adding product:', error);
      toast({ title: "Error", description: "No se pudo agregar el producto.", variant: "destructive" });
    }
  };

  const resetForm = () => {
    setProductId("");
    setQuantity(1);
    setUnitPrice(0);
  };

  const totalPrice = quantity * unitPrice;
  const commissionAmount = (totalPrice * (commissionRate || 0)) / 100;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) resetForm(); setOpen(isOpen); }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar Producto Vendido</DialogTitle>
          <p className="text-sm text-muted-foreground">Asignado a: {userName}</p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="product">Producto</Label>
            <Select value={productId} onValueChange={setProductId} required>
              <SelectTrigger><SelectValue placeholder="Selecciona un producto" /></SelectTrigger>
              <SelectContent>
                {availableProducts?.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name} - (Stock: {product.stock_quantity ?? 'N/A'})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {productId && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Cantidad</Label>
                  <Input id="quantity" type="number" min="1" value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value) || 1)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unitPrice">Precio Unitario</Label>
                  <Input id="unitPrice" type="number" min="0" step="0.01" value={unitPrice} onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)} required />
                </div>
              </div>

              <div className="bg-muted/50 p-3 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Comisión ({commissionRate || 0}%):</span>
                  <span className={commissionRate ? "text-green-600" : "text-red-600"}>
                    ${commissionAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={addProductMutation.isPending || !productId}>
              Agregar Producto
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
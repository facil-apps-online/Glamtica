import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useActiveProducts } from "@/hooks/useProducts";
import { useAddServiceProduct, useStylistProductCommission } from "@/hooks/useServiceProducts";
import { ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AddServiceProductDialogProps {
  children: React.ReactNode;
  attentionId: string;
  attentionServiceId: string;
  stylistId: string;
  stylistName: string;
}

export const AddServiceProductDialog = ({ 
  children, 
  attentionId, 
  attentionServiceId, 
  stylistId,
  stylistName 
}: AddServiceProductDialogProps) => {
  const [open, setOpen] = useState(false);
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);

  const { data: availableProducts } = useActiveProducts();
  const { data: commissionRate } = useStylistProductCommission(stylistId, productId);
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
    
    // Validaciones básicas
    if (!productId) {
      toast({
        title: "Error",
        description: "Debe seleccionar un producto.",
        variant: "destructive",
      });
      return;
    }

    if (quantity <= 0) {
      toast({
        title: "Error",
        description: "La cantidad debe ser mayor a 0.",
        variant: "destructive",
      });
      return;
    }

    if (unitPrice <= 0) {
      toast({
        title: "Error",
        description: "El precio debe ser mayor a 0.",
        variant: "destructive",
      });
      return;
    }

    // Verificar stock disponible
    if (selectedProduct?.stock_quantity !== undefined && selectedProduct.stock_quantity < quantity) {
      toast({
        title: "Stock insuficiente",
        description: `Solo hay ${selectedProduct.stock_quantity} unidades disponibles.`,
        variant: "destructive",
      });
      return;
    }
    if (commissionRate === undefined) {
      // Si no hay comisión configurada, usar 0% temporalmente
      const confirmSale = window.confirm(
        `El estilista ${stylistName} no tiene comisión configurada para este producto. ¿Desea continuar con 0% de comisión?`
      );
      if (!confirmSale) return;
    }

    try {
      await addProductMutation.mutateAsync({
        attention_id: attentionId,
        attention_service_id: attentionServiceId,
        product_id: productId,
        stylist_id: stylistId,
        quantity: quantity,
        unit_price: unitPrice,
        commission_rate: commissionRate || 0,
      });
      
      setOpen(false);
      resetForm();
      
      toast({
        title: "Producto agregado",
        description: `${selectedProduct?.name} agregado al servicio exitosamente.`,
      });
    } catch (error) {
      console.error('Error adding product:', error);
      toast({
        title: "Error",
        description: "No se pudo agregar el producto. Inténtalo de nuevo.",
        variant: "destructive",
      });
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
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) {
        resetForm();
      }
    }}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Agregar Producto Vendido
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Estilista: {stylistName}
          </p>
          <p className="text-xs text-amber-600">
            ⚠️ El producto se asignará específicamente a este servicio y la comisión será para el estilista que lo presta.
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="product">Producto</Label>
            <Select value={productId} onValueChange={setProductId} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un producto" />
              </SelectTrigger>
              <SelectContent>
                {availableProducts?.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name} - ${product.price}
                    {product.stock_quantity !== undefined && (
                      <span className="text-muted-foreground ml-2">
                        (Stock: {product.stock_quantity}
                        {product.stock_quantity <= (product.min_stock || 0) && (
                          <span className="text-red-600"> - ¡Bajo!</span>
                        )}
                        )
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {productId && (
            <>
              <div className="space-y-2">
                <Label htmlFor="quantity">Cantidad</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  max={selectedProduct?.stock_quantity || 999}
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  required
                />
                {selectedProduct?.stock_quantity !== undefined && (
                  <p className="text-xs text-muted-foreground">
                    Stock disponible: {selectedProduct.stock_quantity} unidades
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="unitPrice">Precio Unitario</Label>
                <Input
                  id="unitPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                  required
                />
              </div>

              {/* Información de comisión */}
              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
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
                <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                  💡 La comisión será pagada únicamente al estilista {stylistName} que presta este servicio.
                </div>
                {!commissionRate && (
                  <p className="text-xs text-red-600">
                    ⚠️ Este estilista no tiene comisión configurada para este producto
                  </p>
                )}
              </div>
            </>
          )}

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
              disabled={
                addProductMutation.isPending || 
                !productId || 
                quantity <= 0 || 
                unitPrice <= 0 ||
                (selectedProduct?.stock_quantity !== undefined && selectedProduct.stock_quantity < quantity)
              }
            >
              Agregar Producto
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
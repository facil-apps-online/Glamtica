
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit } from "lucide-react";
import { useCreateProduct, useUpdateProduct, Product } from "@/hooks/useProducts";
import { useActiveBrands } from "@/hooks/useBrands";
import { BrandDialog } from "./BrandDialog";
import { useSettings } from "@/hooks/useSettings";

interface ProductDialogProps {
  product?: Product;
  trigger?: React.ReactNode;
}

export const ProductDialog = ({ product, trigger }: ProductDialogProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(product?.name || "");
  const [description, setDescription] = useState(product?.description || "");
  const [price, setPrice] = useState(product?.price || 0);
  const [costPrice, setCostPrice] = useState(product?.cost_price || 0);
  const [stockQuantity, setStockQuantity] = useState(product?.stock_quantity || 0);
  const [minStock, setMinStock] = useState(product?.min_stock || 0);
  const [maxStock, setMaxStock] = useState(product?.max_stock || 100);
  const [category, setCategory] = useState(product?.category || "");
  const [brandId, setBrandId] = useState(product?.brand_id || "");
  const [barcode, setBarcode] = useState(product?.barcode || "");
  const [sku, setSku] = useState(product?.sku || "");

  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const { data: brands } = useActiveBrands();
  const { data: settings } = useSettings();

  // Obtener símbolo de moneda de configuración
  const currencySymbol = settings?.find(s => s.key === 'currency')?.value || 'EUR';
  const displaySymbol = currencySymbol === 'EUR' ? '€' : 
                       currencySymbol === 'USD' ? '$' : 
                       currencySymbol === 'GBP' ? '£' : currencySymbol;

  const categories = [
    "Shampoo",
    "Acondicionador", 
    "Tratamientos",
    "Coloración",
    "Styling",
    "Herramientas",
    "Otros"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || price <= 0) {
      return;
    }

    const productData = {
      name,
      description: description || undefined,
      price,
      cost_price: costPrice || 0,
      stock_quantity: stockQuantity || 0,
      min_stock: minStock || 0,
      max_stock: maxStock || 100,
      category: category || undefined,
      brand_id: brandId || undefined,
      barcode: barcode || undefined,
      sku: sku || undefined,
      is_active: true,
    };

    try {
      if (product) {
        await updateMutation.mutateAsync({
          id: product.id!,
          updates: productData,
        });
      } else {
        await createMutation.mutateAsync(productData);
      }
      setOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  const resetForm = () => {
    if (!product) {
      setName("");
      setDescription("");
      setPrice(0);
      setCostPrice(0);
      setStockQuantity(0);
      setMinStock(0);
      setMaxStock(100);
      setCategory("");
      setBrandId("");
      setBarcode("");
      setSku("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Producto
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-primary">
            {product ? "Editar Producto" : "Nuevo Producto"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Producto</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Shampoo Nutritivo"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sku">SKU (Opcional)</Label>
              <Input
                id="sku"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="Ej: SH001"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Categoría</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="brand">Marca</Label>
                <BrandDialog />
              </div>
              <Select value={brandId} onValueChange={setBrandId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una marca" />
                </SelectTrigger>
                <SelectContent>
                  {brands?.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción del producto..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Precio de Venta ({displaySymbol})</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cost_price">Costo ({displaySymbol})</Label>
              <Input
                id="cost_price"
                type="number"
                min="0"
                step="0.01"
                value={costPrice}
                onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stock">Stock Actual</Label>
              <Input
                id="stock"
                type="number"
                min="0"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="min_stock">Stock Mínimo</Label>
              <Input
                id="min_stock"
                type="number"
                min="0"
                value={minStock}
                onChange={(e) => setMinStock(parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_stock">Stock Máximo</Label>
              <Input
                id="max_stock"
                type="number"
                min="0"
                value={maxStock}
                onChange={(e) => setMaxStock(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="barcode">Código de Barras (Opcional)</Label>
            <Input
              id="barcode"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="Código de barras del producto"
            />
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
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {product ? "Actualizar" : "Crear"} Producto
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

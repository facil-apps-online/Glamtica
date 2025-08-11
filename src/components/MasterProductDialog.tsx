
import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit } from "lucide-react";
import { useCreateMasterProduct, useUpdateMasterProduct, MasterProduct } from "@/hooks/useProducts";
import { useBrands } from "@/hooks/useBrands";
import { useProductCategories } from "@/hooks/useProductCategories";
import { usePriceFormat } from "@/hooks/usePriceFormat";
import { MultiSelect } from "@/components/ui/MultiSelect";
import { useTaxTypes } from "@/hooks/useTaxTypes";
import { useProductTaxTypes, useAddProductTaxType, useRemoveProductTaxType } from "@/hooks/useProductTaxTypes";
import { useToast } from "@/hooks/use-toast";

interface MasterProductDialogProps {
  product?: MasterProduct;
  trigger?: React.ReactNode;
}

export const MasterProductDialog = ({ product, trigger }: MasterProductDialogProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [costPrice, setCostPrice] = useState<number | string>("");
  const [category, setCategory] = useState("");
  const [brandId, setBrandId] = useState("");
  const [barcode, setBarcode] = useState("");
  const [sku, setSku] = useState("");
  const [selectedTaxTypeIds, setSelectedTaxTypeIds] = useState<string[]>([]);

  const { mutate: createProduct, isPending: isCreating } = useCreateMasterProduct();
  const { mutate: updateProduct, isPending: isUpdating } = useUpdateMasterProduct();
  const { data: brands } = useBrands();
  const { data: productCategories } = useProductCategories();
  const { formatPrice } = usePriceFormat();
  const { data: taxTypes } = useTaxTypes();
  const { data: productTaxTypes, refetch: refetchProductTaxTypes } = useProductTaxTypes(product?.id || '');
  const { mutate: addProductTaxType } = useAddProductTaxType();
  const { mutate: removeProductTaxType } = useRemoveProductTaxType();

  useEffect(() => {
    if (product) {
      setName(product.name || "");
      setDescription(product.description || "");
      setCostPrice(product.cost_price || "");
      setCategory(product.category || "");
      setBrandId(product.brand_id || "");
      setBarcode(product.barcode || "");
      setSku(product.sku || "");
      if (productTaxTypes) {
        setSelectedTaxTypeIds(productTaxTypes.map(pt => pt.tax_type_id));
      }
    } else {
      resetForm();
    }
  }, [product, productTaxTypes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      toast({ title: "Error", description: "El nombre del producto es requerido.", variant: "destructive" });
      return;
    }

    const productData = {
      name,
      description: description || undefined,
      cost_price: Number(costPrice) || 0,
      category: category || undefined,
      brand_id: brandId || undefined,
      barcode: barcode || undefined,
      sku: sku || undefined,
    };

    let productId: string | undefined;

    if (product) {
      updateProduct({ id: product.id, updates: productData }, {
        onSuccess: (updatedProduct) => {
          productId = updatedProduct.id;
          handleTaxTypeUpdates(productId);
          handleSuccess();
        },
        onError: (error) => {
          toast({ title: "Error", description: `Error al actualizar producto: ${error.message}`, variant: "destructive" });
        }
      });
    } else {
      createProduct(productData, {
        onSuccess: (newProduct) => {
          productId = newProduct.id;
          handleTaxTypeUpdates(productId);
          handleSuccess();
        },
        onError: (error) => {
          toast({ title: "Error", description: `Error al crear producto: ${error.message}`, variant: "destructive" });
        }
      });
    }
  };

  const handleTaxTypeUpdates = (currentProductId: string) => {
    if (!currentProductId) return;

    const currentTaxTypeIds = productTaxTypes?.map(pt => pt.tax_type_id) || [];

    const taxTypesToAdd = selectedTaxTypeIds.filter(id => !currentTaxTypeIds.includes(id));
    taxTypesToAdd.forEach(taxTypeId => {
      addProductTaxType({ product_id: currentProductId, tax_type_id: taxTypeId }, {
        onError: (error) => {
          toast({ title: "Error", description: `Error al añadir tipo de impuesto: ${error.message}`, variant: "destructive" });
        }
      });
    });

    const taxTypesToRemove = currentTaxTypeIds.filter(id => !selectedTaxTypeIds.includes(id));
    taxTypesToRemove.forEach(taxTypeId => {
      const productTaxType = productTaxTypes?.find(pt => pt.tax_type_id === taxTypeId);
      if (productTaxType) {
        removeProductTaxType({ id: productTaxType.id }, {
          onError: (error) => {
            toast({ title: "Error", description: `Error al eliminar tipo de impuesto: ${error.message}`, variant: "destructive" });
          }
        });
      }
    });
    refetchProductTaxTypes();
  };

  const handleSuccess = () => {
    setOpen(false);
    resetForm();
    toast({ title: "Éxito", description: `Producto ${product ? 'actualizado' : 'creado'} correctamente.`, variant: "success" });
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setCostPrice("");
    setCategory("");
    setBrandId("");
    setBarcode("");
    setSku("");
    setSelectedTaxTypeIds([]);
  };

  const taxTypeOptions = useMemo(() => {
    return taxTypes?.map(tt => ({ value: tt.id, label: tt.name })) || [];
  }, [taxTypes]);

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
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{product ? "Editar Producto" : "Nuevo Producto"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Producto</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input id="sku" value={sku} onChange={(e) => setSku(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Categoría</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {productCategories?.map((cat) => <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand">Marca</Label>
              <Select value={brandId} onValueChange={setBrandId}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {brands?.map((brand) => <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="taxTypes">Tipos de Impuesto</Label>
            <MultiSelect
              options={taxTypeOptions}
              selected={selectedTaxTypeIds}
              onSelectedChange={setSelectedTaxTypeIds}
              placeholder="Seleccionar tipos de impuesto"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
              <Label htmlFor="cost_price">Precio de Costo</Label>
              <Input id="cost_price" type="number" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="barcode">Código de Barras</Label>
              <Input id="barcode" value={barcode} onChange={(e) => setBarcode(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={isCreating || isUpdating}>
              {product ? "Actualizar" : "Crear"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

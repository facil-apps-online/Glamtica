import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useCreateMasterProduct, useUpdateMasterProduct, MasterProduct } from "@/hooks/useProducts";
import { useProductTaxTypes, useAddProductTaxType, useRemoveProductTaxType } from "@/hooks/useProductTaxTypes";
import { useToast } from "@/hooks/use-toast";
import { ProductForm } from "./ProductForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductImageGallery } from "./ProductImageGallery";

interface MasterProductDialogProps {
  product?: MasterProduct;
  trigger?: React.ReactNode;
  onOpenChange?: (open: boolean) => void;
}

export const MasterProductDialog = ({ product, trigger, onOpenChange }: MasterProductDialogProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    onOpenChange?.(isOpen);
  };

  const { mutate: createProduct, isPending: isCreating } = useCreateMasterProduct();
  const { mutate: updateProduct, isPending: isUpdating } = useUpdateMasterProduct();
  const { data: productTaxTypes, refetch: refetchProductTaxTypes } = useProductTaxTypes(product?.id || '');
  const { mutate: addProductTaxType } = useAddProductTaxType();
  const { mutate: removeProductTaxType } = useRemoveProductTaxType();

  useEffect(() => {
    if (open) {
      refetchProductTaxTypes();
    }
  }, [open, refetchProductTaxTypes]);

  const handleSubmit = (formData: any, selectedTaxIds: string[]) => {
    const handleSuccess = (productId: string) => {
      handleTaxTypeUpdates(productId, selectedTaxIds);
      setOpen(false);
      toast({ title: "Éxito", description: `Producto ${product ? 'actualizado' : 'creado'} correctamente.`, variant: "success" });
    };

    if (product) {
      updateProduct({ id: product.id, updates: formData }, {
        onSuccess: (updatedProduct) => handleSuccess(updatedProduct.id),
        onError: (error) => toast({ title: "Error", description: `Error al actualizar producto: ${error.message}`, variant: "destructive" }),
      });
    } else {
      createProduct(formData, {
        onSuccess: (newProduct) => handleSuccess(newProduct.id),
        onError: (error) => toast({ title: "Error", description: `Error al crear producto: ${error.message}`, variant: "destructive" }),
      });
    }
  };

  const handleTaxTypeUpdates = (currentProductId: string, selectedTaxIds: string[]) => {
    if (!currentProductId) return;

    const currentTaxTypeIds = productTaxTypes?.map(pt => pt.tax_type_id) || [];
    const taxTypesToAdd = selectedTaxIds.filter(id => !currentTaxTypeIds.includes(id));
    const taxTypesToRemove = currentTaxTypeIds.filter(id => !selectedTaxIds.includes(id));

    taxTypesToAdd.forEach(taxTypeId => {
      addProductTaxType({ product_id: currentProductId, tax_type_id: taxTypeId });
    });

    taxTypesToRemove.forEach(taxTypeId => {
      const productTaxType = productTaxTypes?.find(pt => pt.tax_type_id === taxTypeId);
      if (productTaxType) {
        removeProductTaxType({ id: productTaxType.id });
      }
    });
    refetchProductTaxTypes();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Producto
          </Button>
        )}
      </DialogTrigger>
      <DialogContent onInteractOutside={(e) => { e.preventDefault(); e.stopPropagation(); handleOpenChange(false); }} className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{product ? "Editar Producto" : "Nuevo Producto"}</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="details">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Detalles</TabsTrigger>
            <TabsTrigger value="images" disabled={!product}>Imágenes</TabsTrigger>
          </TabsList>
          <TabsContent value="details">
            <ProductForm
              product={product}
              onSubmit={handleSubmit}
              onCancel={() => setOpen(false)}
              isSaving={isCreating || isUpdating}
            />
          </TabsContent>
          <TabsContent value="images">
            {product && <ProductImageGallery productId={product.id} />}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
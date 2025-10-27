
import { useState } from 'react';
import { useMasterProducts } from "@/hooks/useProducts";
import { useProductsBySupplier, useAddSupplierProduct, useUpdateSupplierProduct, useToggleSupplierProductStatus } from "@/hooks/useSupplierProducts";
import { usePriceFormat } from "@/hooks/usePriceFormat";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const SupplierProductsManager = ({ supplierId }) => {
    const [newProductId, setNewProductId] = useState("");
    const [newSupplierPrice, setNewSupplierPrice] = useState<number | string>(0);

    const { toast } = useToast();
    const { data: allProducts } = useMasterProducts("", true, "", "");
    const { data: supplierProducts, isLoading: isLoadingSupplierProducts, refetch } = useProductsBySupplier(supplierId);
    const addSupplierProductMutation = useAddSupplierProduct();
    const updateSupplierProductMutation = useUpdateSupplierProduct();
    const toggleSupplierProductStatusMutation = useToggleSupplierProductStatus();
    const { formatPrice } = usePriceFormat();

    const handleAddSupplierProduct = async () => {
        if (!supplierId) {
            toast({ title: "Error", description: "ID de proveedor no encontrado.", variant: "destructive" });
            return;
        }
        if (!newProductId) {
            toast({ title: "Error", description: "Por favor, seleccione un producto.", variant: "destructive" });
            return;
        }
        if (typeof newSupplierPrice !== 'number' || newSupplierPrice < 0) {
            toast({ title: "Error", description: "Por favor, ingrese un precio válido.", variant: "destructive" });
            return;
        }

        await addSupplierProductMutation.mutateAsync({
            supplier_id: supplierId,
            product_id: newProductId,
            supplier_price: Number(newSupplierPrice),
        }, {
            onSuccess: () => {
                toast({ title: "Éxito", description: "Producto añadido al proveedor." });
                setNewProductId("");
                setNewSupplierPrice(0);
                refetch();
            }
        });
    };

    const handleUpdateSupplierProductPrice = async (supplierProductId: string, price: number) => {
        await updateSupplierProductMutation.mutateAsync({ id: supplierProductId, supplier_price: price }, {
            onSuccess: () => {
                toast({ title: "Éxito", description: "Precio actualizado." });
                refetch();
            }
        });
    };

    const handleToggleSupplierProductStatus = async (supplierProductId: string, isActive: boolean) => {
        await toggleSupplierProductStatusMutation.mutateAsync({ id: supplierProductId, is_active: isActive }, {
            onSuccess: () => {
                toast({ title: "Éxito", description: "Estado actualizado." });
                refetch();
            }
        });
    };

    const availableProducts = allProducts?.filter(p => 
        !supplierProducts?.some(sp => sp.product_id === p.id)
    );

    return (
        <Card>
            <CardHeader>
                <CardTitle>Productos del Proveedor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex flex-col md:flex-row gap-2 border p-4 rounded-md">
                    <div className="flex-1">
                        <Label htmlFor="product">Producto</Label>
                        <Select value={newProductId} onValueChange={setNewProductId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar producto del catálogo" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableProducts?.map((product) => (
                                    <SelectItem key={product.id} value={product.id}>
                                    {product.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="w-40">
                        <Label htmlFor="price">Precio de Costo</Label>
                        <Input
                            id="price"
                            type="number"
                            step="0.01"
                            value={newSupplierPrice}
                            onChange={(e) => setNewSupplierPrice(parseFloat(e.target.value) || 0)}
                        />
                    </div>
                    <Button type="button" onClick={handleAddSupplierProduct} className="mt-4 md:mt-auto" disabled={addSupplierProductMutation.isPending}>
                        <Plus className="w-4 h-4 mr-2" />
                        Añadir
                    </Button>
                </div>

                <div className="space-y-4">
                    <h4 className="text-md font-medium">Productos Asociados</h4>
                    {isLoadingSupplierProducts ? (
                        <div>Cargando productos...</div>
                    ) : supplierProducts && supplierProducts.length > 0 ? (
                            <div className="space-y-2">
                                {supplierProducts.map((sp) => (
                                    <div key={sp.id} className="flex items-center justify-between p-2 border rounded-md gap-4">
                                        <div className="flex-1 font-medium">
                                            {sp.products.name}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Label htmlFor={`price-${sp.id}`} className="sr-only">Precio</Label>
                                            <Input
                                                id={`price-${sp.id}`}
                                                type="number"
                                                step="0.01"
                                                defaultValue={sp.supplier_price}
                                                onBlur={(e) => handleUpdateSupplierProductPrice(sp.id, parseFloat(e.target.value) || 0)}
                                                className="w-28 text-right"
                                            />
                                            <Switch
                                                checked={sp.is_active}
                                                onCheckedChange={(checked) => handleToggleSupplierProductStatus(sp.id, checked)}
                                                aria-label={`Activar o desactivar ${sp.products?.name}`}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>                    ) : (
                        <p className="text-center text-sm text-muted-foreground py-4">No hay productos asociados a este proveedor.</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

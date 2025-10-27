import { useParams, useNavigate } from 'react-router-dom';
import { useMasterProducts, useUpdateMasterProduct, MasterProduct } from '@/hooks/useProducts';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductImageGallery } from '@/components/ProductImageGallery';
import { ChatterBox } from '@/components/ChatterBox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBrands } from "@/hooks/useBrands";
import { useProductCategories } from "@/hooks/useProductCategories";
import { useUnitsOfMeasure } from "@/hooks/useUnitsOfMeasure";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from 'react';

import ProductPricesManager from '@/components/ProductPricesManager';
import { ProductCommissionsManager } from '@/components/ProductCommissionsManager';
import { useQueryClient } from '@tanstack/react-query';

// Este será el formulario de detalles básicos

const ProductDetailsForm = ({ product, onFormChange, onSave, isSaving, unitsOfMeasure, brands, productCategories }) => {
  const [formData, setFormData] = useState(product);

  useEffect(() => {
    onFormChange(formData);
  }, [formData, onFormChange]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(); }} className="space-y-4 pt-4">
       <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre del Producto</Label>
          <Input id="name" value={formData.name} onChange={(e) => handleChange('name', e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sku">SKU</Label>
          <Input id="sku" value={formData.sku} onChange={(e) => handleChange('sku', e.target.value)} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Textarea id="description" value={formData.description} onChange={(e) => handleChange('description', e.target.value)} />
      </div>
       <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Categoría</Label>
          <Select value={formData.category} onValueChange={(value) => handleChange('category', value)}>
            <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
            <SelectContent>
              {productCategories?.map((cat) => <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="brand">Marca</Label>
          <Select value={formData.brand_id} onValueChange={(value) => handleChange('brand_id', value)}>
            <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
            <SelectContent>
              {brands?.map((brand) => <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Unidad de Medida</Label>
        <Select value={formData.unit_of_measure_id} onValueChange={(value) => handleChange('unit_of_measure_id', value)}>
          <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
          <SelectContent>
            {unitsOfMeasure?.map((uom) => <SelectItem key={uom.id} value={uom.id}>{uom.name} ({uom.abbreviation})</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="packageContentQuantity">Contenido del Envase (en UoM)</Label>
          <Input id="packageContentQuantity" type="number" value={formData.package_content_quantity} onChange={(e) => handleChange('package_content_quantity', Number(e.target.value))} />
        </div>
        <div className="space-y-2 flex flex-col justify-center">
          <Label htmlFor="allowDecimalSale" className="mb-2">Permitir Venta Decimal</Label>
          <Switch id="allowDecimalSale" checked={formData.allow_decimal_sale} onCheckedChange={(value) => handleChange('allow_decimal_sale', value)} />
        </div>
      </div>
       <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
          <Label htmlFor="cost_price">Precio de Costo</Label>
          <Input id="cost_price" type="number" value={formData.cost_price} onChange={(e) => handleChange('cost_price', Number(e.target.value))} disabled />
        </div>
        <div className="space-y-2">
          <Label htmlFor="barcode">Código de Barras</Label>
          <Input id="barcode" value={formData.barcode} onChange={(e) => handleChange('barcode', e.target.value)} />
        </div>
      </div>
      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={isSaving}>
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Guardando...' : 'Guardar Detalles'}
        </Button>
      </div>
    </form>
  );
}

const ProductEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: products, isLoading: isLoadingProducts } = useMasterProducts();
  const { mutate: updateProduct, isPending: isUpdating } = useUpdateMasterProduct();
  const { units: unitsOfMeasure, isLoading: isLoadingUoM, refetch: refetchUoM } = useUnitsOfMeasure();
  const { data: brands, isLoading: isLoadingBrands } = useBrands();
  const { data: productCategories, isLoading: isLoadingCategories } = useProductCategories();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("details");

  const [productData, setProductData] = useState<Partial<MasterProduct> | null>(null);

  const product = products?.find(p => p.id === id);

  useEffect(() => {
    refetchUoM();
  }, [refetchUoM]);

  useEffect(() => {
    if (product) {
      setProductData(product);
    }
  }, [product]);

  const handleFormChange = (updatedData) => {
    setProductData(updatedData);
  };

  const handleSave = () => {
    if (!id || !productData) return;
    
    const changedData = Object.keys(productData).reduce((acc, key) => {
      if (productData[key] !== product[key]) {
        acc[key] = productData[key];
      }
      return acc;
    }, {});

    if (Object.keys(changedData).length > 0) {
        updateProduct({ id, updates: changedData }, {
        onSuccess: () => {
          toast({ title: "Éxito", description: "Producto actualizado correctamente.", variant: "success" });
          queryClient.invalidateQueries({ queryKey: ['chatter', 'products', id] });
        },
        onError: (error) => {
          toast({ title: "Error", description: error.message, variant: "destructive" });
        }
      });
    } else {
      toast({ title: "Información", description: "No se han detectado cambios.", variant: "info" });
    }
  };

  const isLoading = isLoadingProducts || isLoadingUoM || isLoadingBrands || isLoadingCategories;

  if (isLoading) {
    return <div>Cargando...</div>; // Placeholder de carga
  }

  if (!product) {
    return <div>Producto no encontrado</div>; // Placeholder de error
  }

  return (
    <div className="space-y-8">
      <PageHeader 
        title={product.name} 
        subtitle="Gestiona todos los aspectos del producto." 
        backButton={
          <Button variant="outline" size="icon" onClick={() => navigate('/app/products')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="md:hidden">
            <Select onValueChange={setActiveTab} value={activeTab}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar una sección..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="details">Detalles</SelectItem>
                <SelectItem value="images">Imágenes</SelectItem>
                <SelectItem value="prices">Precios</SelectItem>
                <SelectItem value="commissions">Comisiones</SelectItem>
              </SelectContent>
            </Select>
            <div className="pt-4">
              {activeTab === 'details' && (
                <Card>
                  <CardHeader><CardTitle>Detalles del Producto</CardTitle></CardHeader>
                  <CardContent>
                    {productData && (
                      <ProductDetailsForm 
                        product={productData} 
                        onFormChange={handleFormChange} 
                        onSave={handleSave} 
                        isSaving={isUpdating} 
                        unitsOfMeasure={unitsOfMeasure}
                        brands={brands}
                        productCategories={productCategories}
                      />
                    )}
                  </CardContent>
                </Card>
              )}
              {activeTab === 'images' && (
                <Card>
                  <CardHeader><CardTitle>Imágenes del Producto</CardTitle></CardHeader>
                  <CardContent>
                    <ProductImageGallery productId={id} />
                  </CardContent>
                </Card>
              )}
              {activeTab === 'prices' && (
                <Card>
                  <CardHeader><CardTitle>Precios por Sucursal</CardTitle></CardHeader>
                  <CardContent>
                    <ProductPricesManager productId={id} />
                  </CardContent>
                </Card>
              )}
              {activeTab === 'commissions' && (
                <Card>
                  <CardHeader><CardTitle>Comisiones del Producto</CardTitle></CardHeader>
                  <CardContent>
                    <ProductCommissionsManager productId={id} productName={product.name} />
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
          <div className="hidden md:block">
            <Tabs defaultValue="details" onValueChange={setActiveTab} value={activeTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="details">Detalles</TabsTrigger>
                <TabsTrigger value="images">Imágenes</TabsTrigger>
                <TabsTrigger value="prices">Precios</TabsTrigger>
                <TabsTrigger value="commissions">Comisiones</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details">
                <Card>
                  <CardHeader><CardTitle>Detalles del Producto</CardTitle></CardHeader>
                  <CardContent>
                    {productData && (
                      <ProductDetailsForm 
                        product={productData} 
                        onFormChange={handleFormChange} 
                        onSave={handleSave} 
                        isSaving={isUpdating} 
                        unitsOfMeasure={unitsOfMeasure}
                        brands={brands}
                        productCategories={productCategories}
                      />
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="images">
                <Card>
                  <CardHeader><CardTitle>Imágenes del Producto</CardTitle></CardHeader>
                  <CardContent>
                    <ProductImageGallery productId={id} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="prices">
                <Card>
                  <CardHeader><CardTitle>Precios por Sucursal</CardTitle></CardHeader>
                  <CardContent>
                    <ProductPricesManager productId={id} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="commissions">
                <Card>
                  <CardHeader><CardTitle>Comisiones del Producto</CardTitle></CardHeader>
                  <CardContent>
                    <ProductCommissionsManager productId={id} productName={product.name} />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
        <div>
          <ChatterBox resourceType="products" resourceId={product.id} tenantId={product.tenant_id} containerClassName="h-[calc(100vh-22rem)]" />
        </div>
      </div>
    </div>
  );
};

export default ProductEditPage;
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MasterProduct } from "@/hooks/useProducts";
import { useBrands } from "@/hooks/useBrands";
import { useProductCategories } from "@/hooks/useProductCategories";
import { useTaxTypes } from "@/hooks/useTaxTypes";
import { useUnitsOfMeasure } from "@/hooks/useUnitsOfMeasure";
import { MultiSelect } from "@/components/ui/MultiSelect";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

interface ProductFormProps {
  product?: MasterProduct;
  onSubmit: (data: any, selectedTaxIds: string[]) => void;
  onCancel: () => void;
  isSaving: boolean;
}

export const ProductForm = ({ product, onSubmit, onCancel, isSaving }: ProductFormProps) => {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [costPrice, setCostPrice] = useState<number | string>("");
  const [category, setCategory] = useState("");
  const [brandId, setBrandId] = useState("");
  const [barcode, setBarcode] = useState("");
  const [sku, setSku] = useState("");
  const [selectedTaxTypeIds, setSelectedTaxTypeIds] = useState<string[]>([]);
  const [unitOfMeasureId, setUnitOfMeasureId] = useState("");
  const [packageContentQuantity, setPackageContentQuantity] = useState<number | string>(1);
  const [allowDecimalSale, setAllowDecimalSale] = useState(false);

  const { data: brands } = useBrands();
  const { data: productCategories } = useProductCategories();
  const { data: taxTypes } = useTaxTypes();
  const { units: unitsOfMeasure } = useUnitsOfMeasure();

  useEffect(() => {
    if (product) {
      setName(product.name || "");
      setDescription(product.description || "");
      setCostPrice(product.cost_price || "");
      setCategory(product.category || "");
      setBrandId(product.brand_id || "");
      setBarcode(product.barcode || "");
      setSku(product.sku || "");
      setUnitOfMeasureId(product.unit_of_measure_id || "");
      setPackageContentQuantity(product.package_content_quantity || 1);
      setAllowDecimalSale(product.allow_decimal_sale || false);
      // Nota: La carga de los impuestos asociados se manejará en el componente padre
    } else {
      resetForm();
    }
  }, [product]);

  const handleSubmit = (e: React.FormEvent) => {
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
      unit_of_measure_id: unitOfMeasureId || undefined,
      package_content_quantity: Number(packageContentQuantity) || 1,
      allow_decimal_sale: allowDecimalSale,
    };
    onSubmit(productData, selectedTaxTypeIds);
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
    setUnitOfMeasureId("");
    setPackageContentQuantity(1);
    setAllowDecimalSale(false);
  };

  const taxTypeOptions = useMemo(() => {
    return taxTypes?.map(tt => ({ value: tt.id, label: tt.name })) || [];
  }, [taxTypes]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
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
        <Label>Unidad de Medida</Label>
        <div className="flex items-center gap-2">
          <Select value={unitOfMeasureId} onValueChange={setUnitOfMeasureId}>
            <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
            <SelectContent>
              {unitsOfMeasure?.map((uom) => <SelectItem key={uom.id} value={uom.id}>{uom.name} ({uom.abbreviation})</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="packageContentQuantity">Contenido del Envase (en UoM)</Label>
          <Input id="packageContentQuantity" type="number" value={packageContentQuantity} onChange={(e) => setPackageContentQuantity(e.target.value)} />
        </div>
        <div className="space-y-2 flex flex-col justify-center">
          <Label htmlFor="allowDecimalSale" className="mb-2">Permitir Venta Decimal</Label>
          <Switch id="allowDecimalSale" checked={allowDecimalSale} onCheckedChange={setAllowDecimalSale} />
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
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={isSaving}>
          {product ? "Actualizar" : "Crear"}
        </Button>
      </div>
    </form>
  );
};
